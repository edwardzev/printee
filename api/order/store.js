// Minimal in-memory store for development/testing only.
// In serverless environments, this is per-invocation ephemeral. For local dev, it persists in-process.
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

const state = {
  orders: new Map(),
};

// Enable file persistence in non-production by default, override with env
export const DEV_PERSIST =
  process.env.DEV_PERSIST_ORDERS === '1' ||
  (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1');

const dataDir = path.join(process.cwd(), 'data');
const ordersFile = path.join(dataDir, 'orders.jsonl');

function ensureDataDir() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (e) {
    // best-effort; ignore if cannot create (e.g., serverless)
  }
}

async function appendOrderToFile(order) {
  if (!DEV_PERSIST) return;
  try {
    ensureDataDir();
    const line = JSON.stringify(order) + '\n';
    await fsp.appendFile(ordersFile, line, 'utf8');
  } catch (e) {
    // swallow errors in serverless/readonly environments
  }
}

async function readAllOrdersFromFile() {
  try {
    const buf = await fsp.readFile(ordersFile, 'utf8');
    const lines = buf.split(/\n+/).filter(Boolean);
    const records = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj && obj.id) records.push(obj);
      } catch (_) {
        // skip bad line
      }
    }
    return records;
  } catch (e) {
    return [];
  }
}

export async function createOrder(order) {
  const id = order.id || String(Date.now());
  const now = new Date().toISOString();
  const rec = { id, created_at: now, ...order };
  state.orders.set(id, rec);
  // fire-and-forget append in background (no await to avoid adding latency)
  appendOrderToFile(rec);
  return rec;
}

export function getOrder(id) {
  return state.orders.get(String(id)) || null;
}

export function listOrders(limit = 20) {
  const all = Array.from(state.orders.values());
  all.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return all.slice(0, Math.max(1, Math.min(200, Number(limit) || 20)));
}

export async function listOrdersFromFile(limit = 20) {
  const all = await readAllOrdersFromFile();
  all.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return all.slice(0, Math.max(1, Math.min(200, Number(limit) || 20)));
}

export async function getOrderFromFile(id) {
  const all = await readAllOrdersFromFile();
  const target = String(id);
  return all.find((o) => String(o.id) === target) || null;
}
