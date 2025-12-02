# Error Logging System

This document describes the unified error logging system for Airtable and Dropbox API operations.

## Overview

The error logging system provides centralized, structured error logging that:
- Reports errors uniformly across all API routes and utilities
- Includes identifying context (orderId, endpoint, file paths, record IDs)
- Sends logs to Sentry in production or console in development
- Works seamlessly in Vercel serverless functions
- Is safe to use even when Sentry is not configured

## Setup

### Environment Variables

Add these to your `.env` file or Vercel environment variables:

```bash
# Required for production error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Optional configuration
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### Installation

The following packages are already installed:
- `@sentry/nextjs` - Sentry SDK for error tracking
- `vitest` - Test framework for unit tests

## Usage

### In API Routes

```javascript
import { logError } from '../lib/logger.js';

export default async function handler(req, res) {
  try {
    // Your API logic here
    const result = await someOperation();
    res.status(200).json({ success: true, result });
  } catch (err) {
    // Log the error with context
    logError(err, { 
      endpoint: '/api/your-endpoint',
      orderId: req.body?.orderId,
      // Add any other relevant context
    });
    res.status(500).json({ error: 'Operation failed' });
  }
}
```

### Using Utility Libraries

The Airtable and Dropbox utility libraries already include error logging:

```javascript
import { createAirtableRecord, updateAirtableRecord } from '../lib/airtable.js';
import { uploadToDropbox, createDropboxFolder } from '../lib/dropbox.js';

// These functions automatically log errors with appropriate context
try {
  const record = await createAirtableRecord(baseId, table, fields, {
    orderId: 'order-123'
  });
} catch (err) {
  // Error is already logged by the utility function
  // Handle the error appropriately
}
```

### Context Fields

The `logError` function accepts the following context fields:

- `orderId` - Order ID for tracking
- `endpoint` - API endpoint or function name
- `airtableRecordId` - Airtable record ID
- `airtableTable` - Airtable table name
- `dropboxPath` - Dropbox file/folder path
- `payloadPreview` - Preview of request/response data

## Behavior

### Development Mode
When `NODE_ENV !== 'production'` or `SENTRY_DSN` is not set:
- Errors are logged to `console.error`
- Includes all context fields and timestamp
- No data is sent to Sentry

### Production Mode
When `NODE_ENV === 'production'` and `SENTRY_DSN` is configured:
- Errors are sent to Sentry with full context
- No console output (to reduce noise)
- Includes breadcrumbs and stack traces

## Testing

Run tests with:

```bash
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
npm run test:ui    # Run tests with UI
```

The test suite verifies:
- Correct behavior in development vs production
- Handling of different error types (Error objects, strings, unknown)
- Inclusion of all context fields
- Fallback when SENTRY_DSN is missing

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes:
- Environment variable `SENTRY_DSN=""` to ensure tests pass without Sentry configured
- Test execution on Node.js 18.x and 20.x
- Build verification to catch breaking changes

## Files

- `/lib/logger.js` - Core logging functionality
- `/lib/airtable.js` - Airtable utilities with error logging
- `/lib/dropbox.js` - Dropbox utilities with error logging
- `/sentry.client.config.js` - Sentry client configuration
- `/sentry.server.config.js` - Sentry server configuration
- `/tests/logger.test.js` - Test suite
- `/.github/workflows/ci.yml` - CI workflow

## Example API Integration

The main order API (`/api/airtable/order.js`) has been updated to use centralized logging:

```javascript
import { logError } from '../lib/logger.js';

// In helper functions
async function airtableFetchRecord(baseId, table, recordId, token) {
  try {
    // ... fetch logic
  } catch (err) {
    logError(err, { 
      endpoint: 'airtableFetchRecord', 
      airtableRecordId: recordId 
    });
    throw err;
  }
}

// In main handler
export default async function handler(req, res) {
  try {
    // ... main logic
  } catch (e) {
    logError(e, { 
      endpoint: '/api/airtable/order', 
      orderId: idempotency_key 
    });
    return res.status(500).json({ ok: false, error: 'airtable_exception' });
  }
}
```
