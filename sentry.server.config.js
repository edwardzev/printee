import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
  
  // Disable in development or when DSN is not configured
  enabled: process.env.NODE_ENV === "production" && !!process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  beforeSend(event) {
    // Don't send events if Sentry is not configured
    if (!process.env.SENTRY_DSN) {
      return null;
    }
    return event;
  },
});
