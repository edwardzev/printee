#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import process from 'process';
import { validateProductPayload, injectProduct } from './utils/productInjector.js';

async function main() {
  const [, , input] = process.argv;

  if (!input) {
    console.error('Usage: node scripts/apply-product-json.mjs <path-to-product.json>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), input);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Cannot find file at ${resolvedPath}`);
    process.exit(1);
  }

  let payload;
  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    payload = JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse JSON file:', error.message);
    process.exit(1);
  }

  const validation = validateProductPayload(payload);
  if (!validation.valid) {
    console.error('Validation errors:');
    validation.errors.forEach((err) => console.error(` - ${err}`));
    process.exit(1);
  }

  if (validation.warnings.length) {
    console.warn('Warnings:');
    validation.warnings.forEach((warn) => console.warn(` - ${warn}`));
  }

  try {
    const result = injectProduct(payload, {
      productsPath: path.join(process.cwd(), 'src', 'data', 'products.js')
    });
    console.log(`✅ Product ${result.sku} inserted into ${result.productsPath}`);
  } catch (error) {
    console.error('❌ Failed to inject product:', error.message);
    process.exit(1);
  }
}

main();
