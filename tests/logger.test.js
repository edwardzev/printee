import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logError } from '../lib/logger.js';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  init: vi.fn(),
}));

describe('logError', () => {
  let consoleErrorSpy;
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Mock console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('logs to console in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SENTRY_DSN;

    const testError = new Error('Test Error');
    const context = { endpoint: '/api/test', orderId: '123' };

    logError(testError, context);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      expect.objectContaining({
        endpoint: '/api/test',
        orderId: '123',
        message: 'Test Error',
      })
    );
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('logs to console when SENTRY_DSN is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SENTRY_DSN;

    const testError = new Error('Production Error without DSN');
    logError(testError, { endpoint: '/api/test' });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('logs to Sentry in production when DSN is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://test@sentry.io/123456';

    const testError = new Error('Prod Error');
    const context = { endpoint: '/api/test', orderId: 'order-456' };

    logError(testError, context);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      testError,
      expect.objectContaining({
        extra: expect.objectContaining({
          endpoint: '/api/test',
          orderId: 'order-456',
          message: 'Prod Error',
        }),
      })
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('handles string errors', () => {
    process.env.NODE_ENV = 'development';
    
    logError('String error message', { endpoint: '/api/test' });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      expect.objectContaining({
        message: 'String error message',
        endpoint: '/api/test',
      })
    );
  });

  it('handles unknown error types', () => {
    process.env.NODE_ENV = 'development';
    
    logError({ custom: 'object' }, { endpoint: '/api/test' });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      expect.objectContaining({
        message: 'Unknown error',
        endpoint: '/api/test',
      })
    );
  });

  it('includes timestamp in logged context', () => {
    process.env.NODE_ENV = 'development';
    
    logError(new Error('Test'), {});

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      expect.objectContaining({
        timestamp: expect.any(String),
      })
    );
  });

  it('includes all context fields', () => {
    process.env.NODE_ENV = 'development';
    
    const context = {
      orderId: 'order-123',
      endpoint: '/api/airtable/order',
      airtableRecordId: 'rec123',
      dropboxPath: '/uploads/file.pdf',
      payloadPreview: { test: 'data' },
    };

    logError(new Error('Test'), context);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[API Error]',
      expect.objectContaining(context)
    );
  });
});
