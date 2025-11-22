import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

const traverseFn = typeof traverse === 'function' ? traverse : traverse.default;
const generateFn = typeof generate === 'function' ? generate : generate.default;

const VALID_SEARCH_TAGS = ['all', 'short_sleeve', 'winter', 'headwear', 'accessories'];
const MAX_STRING_LENGTH = 20000;

export function validateProductPayload(productData = {}) {
  const errors = [];
  const warnings = [];

  // Required fields: sku, nameHe, descriptionHe
  const requiredStringFields = ['sku', 'nameHe', 'descriptionHe'];
  requiredStringFields.forEach((field) => {
    if (!productData[field] || typeof productData[field] !== 'string') {
      errors.push(`${field} is required`);
    } else if (productData[field].length > MAX_STRING_LENGTH) {
      errors.push(`${field} exceeds maximum length (${MAX_STRING_LENGTH})`);
    }
  });

  // Optional fields: name, description - validate length if provided
  if (productData.name && typeof productData.name === 'string' && productData.name.length > MAX_STRING_LENGTH) {
    errors.push(`name exceeds maximum length (${MAX_STRING_LENGTH})`);
  }
  if (productData.description && typeof productData.description === 'string' && productData.description.length > MAX_STRING_LENGTH) {
    errors.push(`description exceeds maximum length (${MAX_STRING_LENGTH})`);
  }

  // basePrice is optional - removed validation

  if (!productData.appearance || Number.isNaN(Number(productData.appearance))) {
    warnings.push('appearance is missing, defaulting to 10');
  }

  if (!Array.isArray(productData.colors) || productData.colors.length === 0) {
    errors.push('At least one color is required');
  }

  if (!Array.isArray(productData.sizeRange) || productData.sizeRange.length === 0) {
    errors.push('At least one size is required');
  }

  if (!Array.isArray(productData.search_tag) || productData.search_tag.length === 0) {
    errors.push('At least one search_tag is required');
  } else {
    const invalidTags = productData.search_tag.filter((tag) => !VALID_SEARCH_TAGS.includes(tag));
    if (invalidTags.length) {
      errors.push(`Invalid search_tag values: ${invalidTags.join(', ')}`);
    }
    if (!productData.search_tag.includes('all')) {
      warnings.push("search_tag should include 'all' for default tab visibility");
    }
  }

  if (!productData.pricingTiers || !Array.isArray(productData.pricingTiers) || productData.pricingTiers.length === 0) {
    errors.push('pricingTiers must contain at least one tier');
  } else {
    productData.pricingTiers.forEach((tier, index) => {
      if (tier.min == null || Number.isNaN(Number(tier.min)) || Number(tier.min) <= 0) {
        errors.push(`pricingTiers[${index}].min must be a positive number`);
      }
      if (tier.max != null && tier.max !== '' && tier.max !== Infinity && Number(tier.max) <= Number(tier.min)) {
        errors.push(`pricingTiers[${index}].max must be greater than min or left blank for Infinity`);
      }
      if (tier.price == null || Number(tier.price) <= 0) {
        errors.push(`pricingTiers[${index}].price must be a positive number`);
      }
    });
  }

  if (productData.images && typeof productData.images === 'object') {
    Object.entries(productData.images).forEach(([key, value]) => {
      if (!Array.isArray(value) && typeof value !== 'string') {
        errors.push(`images.${key} must be a string or array of strings`);
      }
    });
  }

  if (productData.specs && typeof productData.specs === 'object') {
    ['material', 'materialHe', 'weight', 'weightHe', 'care', 'careHe'].forEach((field) => {
      const val = productData.specs[field];
      if (val && typeof val !== 'string') {
        errors.push(`specs.${field} must be a string`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function injectProduct(productData, options = {}) {
  const productsPath = options.productsPath || path.join(process.cwd(), 'src', 'data', 'products.js');
  const fileContent = fs.readFileSync(productsPath, 'utf-8');
  const ast = parse(fileContent, {
    sourceType: 'module',
    plugins: ['jsx']
  });

  const { product, pricingTiers } = normalizeProductPayload(productData);

  let productsArrayFound = false;
  let pricingRulesFound = false;
  let insertIndex = -1;

  traverseFn(ast, {
    VariableDeclarator(pathNode) {
      if (
        t.isIdentifier(pathNode.node.id, { name: 'products' }) &&
        t.isArrayExpression(pathNode.node.init)
      ) {
        productsArrayFound = true;
        const elements = pathNode.node.init.elements;

        elements.forEach((elem, idx) => {
          if (!t.isObjectExpression(elem)) {
            return;
          }
          const skuProp = findObjectProperty(elem, 'sku');
          if (skuProp && t.isStringLiteral(skuProp.value) && skuProp.value.value === product.sku) {
            const error = new Error(`Product with SKU ${product.sku} already exists`);
            error.code = 'DUPLICATE_SKU';
            throw error;
          }
        });

        insertIndex = elements.length;
        for (let i = 0; i < elements.length; i++) {
          const elem = elements[i];
          if (!t.isObjectExpression(elem)) continue;
          const appearanceValue = getNumericPropertyValue(elem, 'appearance');
          if (appearanceValue != null && appearanceValue > product.appearance) {
            insertIndex = i;
            break;
          }
        }

        const newNode = buildProductNode(product);
        elements.splice(insertIndex, 0, newNode);
      }

      if (
        t.isIdentifier(pathNode.node.id, { name: 'pricingRules' }) &&
        t.isObjectExpression(pathNode.node.init)
      ) {
        pricingRulesFound = true;
        const ruleObject = pathNode.node.init;

        const hasExistingRule = ruleObject.properties.some((prop) => {
          if (!t.isObjectProperty(prop)) return false;
          const keyName = getPropertyKeyName(prop.key);
          return keyName === product.sku;
        });

        if (hasExistingRule) {
          const error = new Error(`Pricing rule for SKU ${product.sku} already exists`);
          error.code = 'DUPLICATE_PRICING_RULE';
          throw error;
        }

        const newRule = buildPricingRuleNode(product.sku, pricingTiers);
        ruleObject.properties.push(newRule);
      }
    }
  });

  if (!productsArrayFound) {
    throw new Error('Could not find products array in src/data/products.js');
  }

  if (!pricingRulesFound) {
    throw new Error('Could not find pricingRules object in src/data/products.js');
  }

  const output = generateFn(ast, {
    retainLines: false,
    compact: false,
    concise: false,
    quotes: 'single'
  }, fileContent);

  fs.writeFileSync(productsPath, output.code, 'utf-8');

  return {
    productsPath,
    sku: product.sku,
    insertIndex
  };
}

function normalizeProductPayload(data = {}) {
  const product = {
    sku: String(data.sku || '').trim(),
    appearance: Number.isFinite(Number(data.appearance)) ? Number(data.appearance) : 10,
    name: data.name ? String(data.name).trim() : '', // Optional
    nameHe: String(data.nameHe || '').trim(),
    description: data.description ? String(data.description).trim() : '', // Optional
    descriptionHe: String(data.descriptionHe || '').trim(),
    tech: data.tech ? String(data.tech).trim() : 'DTF',
    search_tag: dedupeArray(Array.isArray(data.search_tag) ? data.search_tag : ['all']),
    colors: dedupeArray(Array.isArray(data.colors) ? data.colors : []),
    sizeRange: dedupeArray(Array.isArray(data.sizeRange) ? data.sizeRange : []),
    activePrintAreas: dedupeArray(Array.isArray(data.activePrintAreas) ? data.activePrintAreas : []),
    basePrice: Number.isFinite(Number(data.basePrice)) ? Number(data.basePrice) : 0, // Optional, defaults to 0
    images: {},
    specs: {}
  };

  if (!product.search_tag.includes('all')) {
    product.search_tag.unshift('all');
    product.search_tag = dedupeArray(product.search_tag);
  }

  if (data.images && typeof data.images === 'object') {
    const normalizedImages = {};
    Object.entries(data.images).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const cleaned = value.map((item) => String(item).trim()).filter(Boolean);
        if (cleaned.length) {
          normalizedImages[key] = cleaned;
        }
      } else if (typeof value === 'string' && value.trim()) {
        normalizedImages[key] = [value.trim()];
      }
    });
    product.images = normalizedImages;
  }

  if (data.specs && typeof data.specs === 'object') {
    const normalizedSpecs = {};
    ['material', 'materialHe', 'weight', 'weightHe', 'care', 'careHe'].forEach((field) => {
      if (data.specs[field] && typeof data.specs[field] === 'string') {
        normalizedSpecs[field] = data.specs[field].trim();
      }
    });
    product.specs = normalizedSpecs;
  }

  const pricingTiers = Array.isArray(data.pricingTiers) ? data.pricingTiers.map((tier) => ({ ...tier })) : [];

  const normalizedTiers = pricingTiers
    .map((tier) => {
      const min = Number.isFinite(Number(tier.min)) ? Number(tier.min) : 1;
      const max = tier.max === '' || tier.max == null || tier.max === Infinity
        ? Infinity
        : Number(tier.max);
      return {
        min: min <= 0 ? 1 : min,
        max: Number.isFinite(max) ? max : Infinity,
        price: Number.isFinite(Number(tier.price)) ? Number(tier.price) : 0
      };
    })
    .sort((a, b) => a.min - b.min);

  return { product, pricingTiers: normalizedTiers };
}

function buildProductNode(product) {
  const props = [];

  props.push(objectProp('sku', t.stringLiteral(product.sku)));
  props.push(objectProp('appearance', t.numericLiteral(product.appearance)));
  props.push(objectProp('name', t.stringLiteral(product.name)));
  props.push(objectProp('nameHe', t.stringLiteral(product.nameHe)));
  props.push(objectProp('description', t.stringLiteral(product.description)));
  props.push(objectProp('descriptionHe', t.stringLiteral(product.descriptionHe)));
  props.push(objectProp('tech', t.stringLiteral(product.tech)));

  if (product.search_tag?.length) {
    props.push(objectProp('search_tag', arrayExpressionFromStrings(product.search_tag)));
  }

  if (product.colors?.length) {
    props.push(objectProp('colors', arrayExpressionFromStrings(product.colors)));
  }

  if (product.sizeRange?.length) {
    props.push(objectProp('sizeRange', arrayExpressionFromStrings(product.sizeRange)));
  }

  if (product.images && Object.keys(product.images).length) {
    const imageProps = Object.entries(product.images).map(([key, values]) =>
      t.objectProperty(
        t.identifier(key),
        arrayExpressionFromStrings(values)
      )
    );
    props.push(objectProp('images', t.objectExpression(imageProps)));
  }

  if (product.activePrintAreas?.length) {
    props.push(objectProp('activePrintAreas', arrayExpressionFromStrings(product.activePrintAreas)));
  }

  props.push(objectProp('basePrice', t.numericLiteral(product.basePrice)));

  if (product.specs && Object.keys(product.specs).length) {
    const specProps = Object.entries(product.specs).map(([key, value]) =>
      t.objectProperty(t.identifier(key), t.stringLiteral(value))
    );
    props.push(objectProp('specs', t.objectExpression(specProps)));
  }

  return t.objectExpression(props);
}

function buildPricingRuleNode(sku, tiers) {
  const keyNode = isValidIdentifier(sku) ? t.identifier(sku) : t.stringLiteral(sku);
  const tierNodes = tiers.map((tier) => {
    const tierProps = [
      t.objectProperty(t.identifier('min'), t.numericLiteral(tier.min)),
      t.objectProperty(
        t.identifier('max'),
        tier.max === Infinity ? t.identifier('Infinity') : t.numericLiteral(tier.max)
      ),
      t.objectProperty(t.identifier('price'), t.numericLiteral(tier.price))
    ];
    return t.objectExpression(tierProps);
  });

  return t.objectProperty(
    keyNode,
    t.objectExpression([
      t.objectProperty(
        t.identifier('tiers'),
        t.arrayExpression(tierNodes)
      )
    ])
  );
}

function objectProp(name, value) {
  return t.objectProperty(t.identifier(name), value);
}

function arrayExpressionFromStrings(values = []) {
  return t.arrayExpression(values.map((value) => t.stringLiteral(value)));
}

function dedupeArray(values = []) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function findObjectProperty(objectExpression, propertyName) {
  return objectExpression.properties.find(
    (prop) =>
      t.isObjectProperty(prop) &&
      ((t.isIdentifier(prop.key) && prop.key.name === propertyName) ||
        (t.isStringLiteral(prop.key) && prop.key.value === propertyName))
  );
}

function getNumericPropertyValue(objectExpression, propertyName) {
  const prop = findObjectProperty(objectExpression, propertyName);
  if (!prop) return null;
  if (t.isNumericLiteral(prop.value)) return prop.value.value;
  return null;
}

function getPropertyKeyName(keyNode) {
  if (t.isIdentifier(keyNode)) return keyNode.name;
  if (t.isStringLiteral(keyNode)) return keyNode.value;
  return null;
}

function isValidIdentifier(value) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}
