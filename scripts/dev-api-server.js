#!/usr/bin/env node
/**
 * Dev server for API routes
 * Runs on port 3001 to match Vite proxy configuration
 * Usage: node scripts/dev-api-server.js
 * 
 * This server wraps Vercel serverless functions to work in local development.
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 3001;

const app = express();

app.use(cors());

// Body parsing middleware - but skip for upload routes
app.use((req, res, next) => {
  // Skip body parsing for upload endpoint - multer handles it
  if (req.path === '/api/admin/upload-product-images') {
    return next();
  }
  // Parse JSON and URL-encoded for other routes
  express.json({ limit: '50mb' })(req, res, () => {
    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  });
});

// Wrapper to convert Vercel handler format to Express
function wrapHandler(handler) {
  return async (req, res, next) => {
    try {
      // Vercel handlers expect req/res, which Express provides
      await handler(req, res);
    } catch (error) {
      console.error('Handler error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  };
}

// Import and mount API handlers
async function setupRoutes() {
  // Upload product images handler - needs special handling for multer
  // Don't parse body for this route, let multer handle it
  try {
    const uploadModule = await import('../api/admin/upload-product-images.js');
    const uploadHandler = uploadModule.default;
    app.post('/api/admin/upload-product-images', (req, res, next) => {
      // Skip body parsing for this route - multer will handle it
      wrapHandler(uploadHandler)(req, res, next);
    });
  } catch (err) {
    console.error('Failed to load upload handler:', err);
  }

  // Add product handler
  try {
    const addProductHandler = (await import('../api/admin/add-product.js')).default;
    app.post('/api/admin/add-product', wrapHandler(addProductHandler));
  } catch (err) {
    console.error('Failed to load add-product handler:', err);
  }

  // Order handlers
  try {
    const orderHandler = (await import('../api/order/index.js')).default;
    app.get('/api/order', wrapHandler(orderHandler));
    app.post('/api/order', wrapHandler(orderHandler));
  } catch (err) {
    console.error('Failed to load order handler:', err);
  }
  
  try {
    const orderByIdHandler = (await import('../api/order/[id].js')).default;
    app.get('/api/order/:id', wrapHandler(orderByIdHandler));
  } catch (err) {
    console.error('Failed to load order by id handler:', err);
  }

  // Health check
  try {
    const healthHandler = (await import('../api/health.js')).default;
    app.get('/api/health', wrapHandler(healthHandler));
  } catch (err) {
    console.error('Failed to load health handler:', err);
  }

  // Echo endpoint
  try {
    const echoHandler = (await import('../api/echo.js')).default;
    app.all('/api/echo', wrapHandler(echoHandler));
  } catch (err) {
    console.error('Failed to load echo handler:', err);
  }

  // Airtable order handler
  try {
    const airtableHandler = (await import('../api/airtable/order.js')).default;
    app.post('/api/airtable/order', wrapHandler(airtableHandler));
  } catch (err) {
    console.warn('Airtable handler not available:', err.message);
  }

  // iCount IPN handler
  try {
    const ipnHandler = (await import('../api/icount/ipn.js')).default;
    app.post('/api/icount/ipn', wrapHandler(ipnHandler));
  } catch (err) {
    console.warn('iCount IPN handler not available:', err.message);
  }
}

setupRoutes().catch(console.error);

app.listen(PORT, () => {
  console.log(`[dev-api-server] Running on http://localhost:${PORT}`);
  console.log(`[dev-api-server] API endpoints available at /api/*`);
  console.log(`[dev-api-server] Make sure Vite dev server is running and proxying /api to this server`);
  console.log(`[dev-api-server] Start with: npm run dev:api (in another terminal)`);
});

