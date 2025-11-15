import * as Sentry from "@sentry/nextjs";

/**
 * @typedef {Object} LogContext
 * @property {string} [orderId] - Order ID for tracking
 * @property {string} [endpoint] - API endpoint or function name
 * @property {string} [airtableRecordId] - Airtable record ID
 * @property {string} [dropboxPath] - Dropbox file path
 * @property {unknown} [payloadPreview] - Preview of request/response payload
 */

/**
 * Centralized error logging for Airtable and Dropbox API operations.
 * Logs to Sentry in production or console in development.
 * 
 * @param {unknown} error - The error to log (Error object, string, or unknown)
 * @param {LogContext} [context={}] - Additional context for the error
 */
export function logError(error, context = {}) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

  const meta = { ...context, message, timestamp: new Date().toISOString() };

  if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: meta });
  } else {
    console.error("[API Error]", meta);
  }
}
