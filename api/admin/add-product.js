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

import { validateProductPayload, injectProduct } from '../../scripts/utils/productInjector.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return res.status(501).json({
      error: 'Not Implemented',
      details:
        'Automatic product injection requires filesystem access and is only available in local development. Please run the CLI injector or edit products.js manually in production.'
    });
  }

  const productData = req.body || {};
  const validation = validateProductPayload(productData);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.errors
    });
  }

  try {
    const result = injectProduct(productData);
    return res.status(200).json({
      success: true,
      sku: result.sku,
      warnings: validation.warnings
    });
  } catch (error) {
    if (error.code === 'DUPLICATE_SKU' || error.code === 'DUPLICATE_PRICING_RULE') {
      return res.status(409).json({ error: error.message });
    }

    console.error('Error adding product:', error);
    return res.status(500).json({
      error: 'Failed to add product',
      details: error.message
    });
  }
}
