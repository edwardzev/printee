/**
 * API endpoint to add a new product to products.js
 * POST /api/admin/add-product
 * 
 * SECURITY WARNING: This endpoint modifies source code files and is intended
 * for development use only. It will not work in production serverless environments
 * like Vercel where the filesystem is read-only.
 * 
 * TODO: For production use, this should:
 * - Implement proper authentication (verify admin credentials)
 * - Add authorization checks (verify user has permission to add products)
 * - Use a database instead of modifying source files
 * - Add comprehensive input validation (types, lengths, formats)
 * - Implement rate limiting to prevent abuse
 * - Add audit logging for all product modifications
 * 
 * For development use, run the app locally with `npm run dev`.
 */

import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Add authentication check here
  // Example: if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const productData = req.body;

    // Enhanced validation
    const requiredFields = ['sku', 'name', 'nameHe', 'description', 'descriptionHe', 'basePrice'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate data types and ranges
    if (typeof productData.basePrice !== 'number' || productData.basePrice <= 0) {
      return res.status(400).json({ error: 'Base price must be a positive number' });
    }

    // Validate string lengths to prevent excessively large data
    const maxStringLength = 10000;
    for (const field of ['sku', 'name', 'nameHe', 'description', 'descriptionHe']) {
      if (typeof productData[field] === 'string' && productData[field].length > maxStringLength) {
        return res.status(400).json({ error: `Field ${field} exceeds maximum length` });
      }
    }

    // Validate SKU format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/i.test(productData.sku)) {
      return res.status(400).json({ error: 'SKU must contain only alphanumeric characters and hyphens' });
    }

    // Validate arrays
    if (!Array.isArray(productData.colors) || productData.colors.length === 0) {
      return res.status(400).json({ error: 'At least one color is required' });
    }

    if (!Array.isArray(productData.sizeRange) || productData.sizeRange.length === 0) {
      return res.status(400).json({ error: 'At least one size is required' });
    }

    // Path to products.js
    const productsPath = path.join(process.cwd(), 'src', 'data', 'products.js');

    // Read the current products.js file
    let fileContent = fs.readFileSync(productsPath, 'utf-8');

    // Parse the file into an AST
    const ast = parse(fileContent, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    // Find the products array and add the new product
    let productsArrayFound = false;

    traverse.default(ast, {
      VariableDeclarator(path) {
        // Look for: export const products = [...]
        if (
          path.node.id.name === 'products' &&
          t.isArrayExpression(path.node.init)
        ) {
          productsArrayFound = true;

          // Create the new product object as an AST node
          const newProductNode = createProductASTNode(productData);

          // Find the correct position to insert based on appearance value
          const productsArray = path.node.init.elements;
          let insertIndex = productsArray.length;

          // Find insertion point based on appearance
          for (let i = 0; i < productsArray.length; i++) {
            const elem = productsArray[i];
            if (t.isObjectExpression(elem)) {
              const appearanceProp = elem.properties.find(
                p => t.isObjectProperty(p) && 
                     t.isIdentifier(p.key) && 
                     p.key.name === 'appearance'
              );
              
              if (appearanceProp && t.isNumericLiteral(appearanceProp.value)) {
                if (appearanceProp.value.value > productData.appearance) {
                  insertIndex = i;
                  break;
                }
              }
            }
          }

          // Insert the new product at the correct position
          productsArray.splice(insertIndex, 0, newProductNode);
        }
      }
    });

    if (!productsArrayFound) {
      return res.status(500).json({ error: 'Could not find products array in products.js' });
    }

    // Generate the modified code
    const output = generate.default(ast, {
      retainLines: false,
      compact: false,
      concise: false,
      quotes: 'single'
    }, fileContent);

    // Write back to the file
    fs.writeFileSync(productsPath, output.code, 'utf-8');

    return res.status(200).json({ 
      success: true, 
      message: 'Product added successfully',
      sku: productData.sku
    });

  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ 
      error: 'Failed to add product',
      details: error.message 
    });
  }
}

/**
 * Create an AST node for a product object
 */
function createProductASTNode(productData) {
  const properties = [];

  // sku
  properties.push(
    t.objectProperty(
      t.identifier('sku'),
      t.stringLiteral(productData.sku)
    )
  );

  // appearance
  properties.push(
    t.objectProperty(
      t.identifier('appearance'),
      t.numericLiteral(productData.appearance || 10)
    )
  );

  // name
  properties.push(
    t.objectProperty(
      t.identifier('name'),
      t.stringLiteral(productData.name)
    )
  );

  // nameHe
  properties.push(
    t.objectProperty(
      t.identifier('nameHe'),
      t.stringLiteral(productData.nameHe)
    )
  );

  // description
  properties.push(
    t.objectProperty(
      t.identifier('description'),
      t.stringLiteral(productData.description)
    )
  );

  // descriptionHe
  properties.push(
    t.objectProperty(
      t.identifier('descriptionHe'),
      t.stringLiteral(productData.descriptionHe)
    )
  );

  // tech
  if (productData.tech) {
    properties.push(
      t.objectProperty(
        t.identifier('tech'),
        t.stringLiteral(productData.tech)
      )
    );
  }

  // colors array
  if (productData.colors && productData.colors.length > 0) {
    properties.push(
      t.objectProperty(
        t.identifier('colors'),
        t.arrayExpression(
          productData.colors.map(color => t.stringLiteral(color))
        )
      )
    );
  }

  // sizeRange array
  if (productData.sizeRange && productData.sizeRange.length > 0) {
    properties.push(
      t.objectProperty(
        t.identifier('sizeRange'),
        t.arrayExpression(
          productData.sizeRange.map(size => t.stringLiteral(size))
        )
      )
    );
  }

  // images object
  if (productData.images && Object.keys(productData.images).length > 0) {
    const imageProps = [];
    for (const [color, paths] of Object.entries(productData.images)) {
      if (paths && paths.length > 0) {
        imageProps.push(
          t.objectProperty(
            t.identifier(color),
            t.arrayExpression(
              paths.map(path => t.stringLiteral(path))
            )
          )
        );
      }
    }
    properties.push(
      t.objectProperty(
        t.identifier('images'),
        t.objectExpression(imageProps)
      )
    );
  }

  // activePrintAreas array
  if (productData.activePrintAreas && productData.activePrintAreas.length > 0) {
    properties.push(
      t.objectProperty(
        t.identifier('activePrintAreas'),
        t.arrayExpression(
          productData.activePrintAreas.map(area => t.stringLiteral(area))
        )
      )
    );
  }

  // basePrice
  properties.push(
    t.objectProperty(
      t.identifier('basePrice'),
      t.numericLiteral(productData.basePrice)
    )
  );

  // pricingTiers (stored as pricingRules.tiers in products.js)
  if (productData.pricingTiers && Array.isArray(productData.pricingTiers) && productData.pricingTiers.length > 0) {
    const tiersArray = productData.pricingTiers.map(tier => {
      const tierProps = [];
      
      tierProps.push(
        t.objectProperty(
          t.identifier('min'),
          t.numericLiteral(Number(tier.min) || 1)
        )
      );
      
      tierProps.push(
        t.objectProperty(
          t.identifier('max'),
          tier.max === Infinity || tier.max === '' || tier.max === null
            ? t.identifier('Infinity')
            : t.numericLiteral(Number(tier.max))
        )
      );
      
      tierProps.push(
        t.objectProperty(
          t.identifier('price'),
          t.numericLiteral(Number(tier.price) || 0)
        )
      );
      
      return t.objectExpression(tierProps);
    });

    properties.push(
      t.objectProperty(
        t.identifier('pricingRules'),
        t.objectExpression([
          t.objectProperty(
            t.identifier('tiers'),
            t.arrayExpression(tiersArray)
          )
        ])
      )
    );
  }

  // specs object
  if (productData.specs) {
    const specProps = [];
    
    if (productData.specs.material) {
      specProps.push(
        t.objectProperty(
          t.identifier('material'),
          t.stringLiteral(productData.specs.material)
        )
      );
    }
    
    if (productData.specs.materialHe) {
      specProps.push(
        t.objectProperty(
          t.identifier('materialHe'),
          t.stringLiteral(productData.specs.materialHe)
        )
      );
    }
    
    if (productData.specs.weight) {
      specProps.push(
        t.objectProperty(
          t.identifier('weight'),
          t.stringLiteral(productData.specs.weight)
        )
      );
    }
    
    if (productData.specs.weightHe) {
      specProps.push(
        t.objectProperty(
          t.identifier('weightHe'),
          t.stringLiteral(productData.specs.weightHe)
        )
      );
    }
    
    if (productData.specs.care) {
      specProps.push(
        t.objectProperty(
          t.identifier('care'),
          t.stringLiteral(productData.specs.care)
        )
      );
    }
    
    if (productData.specs.careHe) {
      specProps.push(
        t.objectProperty(
          t.identifier('careHe'),
          t.stringLiteral(productData.specs.careHe)
        )
      );
    }

    if (specProps.length > 0) {
      properties.push(
        t.objectProperty(
          t.identifier('specs'),
          t.objectExpression(specProps)
        )
      );
    }
  }

  return t.objectExpression(properties);
}
