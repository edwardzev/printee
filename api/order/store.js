// Minimal in-memory store for development/testing only.
// In serverless environments, this is per-invocation ephemeral. For local dev, it persists in-process.
const state = {
  orders: new Map(),
};

export function createOrder(order) {
  const id = order.id || String(Date.now());
  const now = new Date().toISOString();
  const rec = { id, created_at: now, ...order };
  state.orders.set(id, rec);
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
