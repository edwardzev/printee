import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Storage key for persisting customer action logs between sessions.
const STORAGE_KEY = 'customer_action_log';
// Flush the in-memory buffer to localStorage after this many actions.
const ACTION_BUFFER_THRESHOLD = 5;
// Interval (ms) for auto-persisting logs to localStorage.
const AUTO_PERSIST_INTERVAL = 10_000;

function formatPrimitive(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value.trim() ? value : '""';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NaN';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

function formatValue(value, depth = 0) {
  const indent = '  '.repeat(depth);
  if (Array.isArray(value)) {
    if (!value.length) return `${indent}(none)`;
    return value
      .map((entry) => {
        const formatted = formatValue(entry, depth + 1);
        const [first, ...rest] = formatted.split('\n');
        const lines = [`${indent}- ${first.trim()}`];
        rest.forEach((line) => lines.push(line));
        return lines.join('\n');
      })
      .join('\n');
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return `${indent}(empty)`;
    return entries
      .map(([key, val]) => {
        const formatted = formatValue(val, depth + 1);
        if (!formatted.includes('\n')) {
          return `${indent}${key}: ${formatted.trim()}`;
        }
        return `${indent}${key}:\n${formatted}`;
      })
      .join('\n');
  }
  return `${indent}${formatPrimitive(value)}`;
}

function formatEntriesForAirtable(entries) {
  return entries
    .map((entry) => {
      const header = `- ${entry.timestamp} • ${entry.action}`;
      if (entry.details == null || entry.details === undefined) return header;
      const block = formatValue(entry.details, 1);
      return `${header}\n${block}`;
    })
    .join('\n');
}

function readLogsFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[useActionLogger] Failed to parse stored log – clearing storage.', error);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    return [];
  }
}

function writeLogsToStorage(logs) {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return true;
  } catch (error) {
    console.warn('[useActionLogger] Failed to persist log to storage.', error);
    return false;
  }
}

function useProvideActionLogger(options = {}) {
  const [logs, setLogs] = useState(() => (typeof window === 'undefined' ? [] : readLogsFromStorage()));
  const logRef = useRef(logs);
  const dirtyRef = useRef(false);
  const bufferedActionsRef = useRef(0);

  useEffect(() => {
    logRef.current = logs;
  }, [logs]);

  const persistLogs = useCallback(() => {
    if (!dirtyRef.current) return;
    if (writeLogsToStorage(logRef.current)) {
      dirtyRef.current = false;
      bufferedActionsRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const interval = window.setInterval(() => {
      persistLogs();
    }, AUTO_PERSIST_INTERVAL);
    return () => window.clearInterval(interval);
  }, [persistLogs]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleUnload = () => {
      try {
        persistLogs();
      } catch (_) {}
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [persistLogs]);

  const record = useCallback((action, details) => {
    if (!action || typeof action !== 'string') {
      console.warn('[useActionLogger] Ignoring record() call with invalid action name.', action);
      return;
    }
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      details: details ?? null,
    };
    setLogs((prev) => {
      const next = [...prev, entry];
      logRef.current = next;
      dirtyRef.current = true;
      bufferedActionsRef.current += 1;
      if (bufferedActionsRef.current >= ACTION_BUFFER_THRESHOLD) {
        persistLogs();
      }
      return next;
    });
  }, [persistLogs]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logRef.current = [];
    dirtyRef.current = false;
    bufferedActionsRef.current = 0;
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
  }, []);

  const flushLogsToAirtable = useCallback(async (orderId, overrides = {}) => {
    const entries = logRef.current;
    if (!orderId) {
      console.warn('[useActionLogger] flushLogsToAirtable requires an orderId (the Airtable record ID).');
      return { ok: false, error: 'missing_order_id' };
    }
    if (!entries.length) {
      // Nothing to flush, treat as success so callers can proceed.
      clearLogs();
      return { ok: true, skipped: true };
    }

    const baseId = overrides.baseId
      || options.baseId
      || import.meta.env?.VITE_AIRTABLE_BASE_ID
      || import.meta.env?.AIRTABLE_BASE_ID;
    const apiKey = overrides.apiKey
      || options.apiKey
      || import.meta.env?.VITE_AIRTABLE_API_KEY
      || import.meta.env?.AIRTABLE_API_KEY;
    const tableName = overrides.tableName
      || options.tableName
      || import.meta.env?.VITE_AIRTABLE_ORDERS_TABLE
      || 'Orders';

    if (!baseId || !apiKey) {
  console.warn('[useActionLogger] Airtable credentials are missing. Define VITE_AIRTABLE_BASE_ID and VITE_AIRTABLE_API_KEY.');
      return { ok: false, error: 'missing_airtable_config' };
    }

    const body = JSON.stringify({
      fields: {
        'Customer Action Log': formatEntriesForAirtable(entries),
      },
    });

    const endpoint = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}/${encodeURIComponent(orderId)}`;
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const attemptFlush = async () => {
      const response = await fetch(endpoint, { method: 'PATCH', headers, body });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const error = new Error(`Airtable responded with ${response.status}: ${text}`);
        error.status = response.status;
        throw error;
      }
      return response.json().catch(() => ({}));
    };

    try {
      await attemptFlush();
      clearLogs();
      return { ok: true };
    } catch (firstError) {
      console.warn('[useActionLogger] Airtable flush failed – retrying once.', firstError);
      try {
        await attemptFlush();
        clearLogs();
        return { ok: true, retried: true };
      } catch (secondError) {
        console.warn('[useActionLogger] Failed to upload customer action log to Airtable.', secondError);
        persistLogs();
        return { ok: false, error: secondError };
      }
    }
  }, [clearLogs, options.apiKey, options.baseId, options.tableName, persistLogs]);

  const getFormattedLog = useCallback(() => formatEntriesForAirtable(logRef.current), []);

  const value = useMemo(() => ({
    log: logRef.current,
    record,
    flushLogsToAirtable,
    clearLogs,
    getFormattedLog,
  }), [record, flushLogsToAirtable, clearLogs, getFormattedLog]);

  return value;
}

const ActionLoggerContext = createContext(null);

export function ActionLoggerProvider({ children, ...options }) {
  const value = useProvideActionLogger(options);
  return (
    <ActionLoggerContext.Provider value={value}>
      {children}
    </ActionLoggerContext.Provider>
  );
}

export function useActionLogger() {
  const context = useContext(ActionLoggerContext);
  if (!context) {
    throw new Error('useActionLogger must be used within an ActionLoggerProvider');
  }
  return context;
}

/**
 * Example usage:
 *
 * import { ActionLoggerProvider, useActionLogger } from '@/hooks/useActionLogger';
 *
 * function AppRoot() {
 *   return (
 *     <ActionLoggerProvider>
 *       <YourApp />
 *     </ActionLoggerProvider>
 *   );
 * }
 *
 * function ProductConfigurator({ orderId }) {
 *   const { record, flushLogsToAirtable } = useActionLogger();
 *
 *   const handleColorChange = (color) => record('select_color', { color });
 *   const handleSubmit = async () => {
 *     await flushLogsToAirtable(orderId);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleColorChange('red')}>Red</button>
 *       <button onClick={handleSubmit}>Submit Order</button>
 *     </div>
 *   );
 * }
 *
 * // Airtable configuration:
 * // Define VITE_AIRTABLE_BASE_ID and VITE_AIRTABLE_API_KEY (or AIRTABLE_BASE_ID / AIRTABLE_API_KEY)
 * // Optionally define VITE_AIRTABLE_ORDERS_TABLE if your table name differs from "Orders".
 * // in your environment so the hook can authenticate directly with Airtable.
 */
