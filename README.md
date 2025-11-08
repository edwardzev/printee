Printee

Pilot apparel customizer (t-shirt/hoodie, white/black, left chest/back).

## Minimal API (dev-only)

how 

Endpoints are implemented as serverless handlers under `api/` and routed by `vercel.json`.

- GET `/api/health` → `{ ok: true, name, version, ts }`
- GET/POST `/api/echo` → returns your query/body
- Orders API
	- POST `/api/order`
		- body: `{ cart: [], contact: { email, name? }, totals: { total, currency, subtotal? }, paymentMethod? }`
		- validation: enforced via AJV; returns 400 with details on invalid payloads
		- response: `{ ok: true, order: { id, created_at, ... } }`
	- GET `/api/order` (list)
		- query: `limit?` (default 20), `from?` (mem|file)
		- response: `{ ok: true, items: [...], count }`
	- GET `/api/order/[id]` (by id)
		- query: `from?` (mem|file)
		- response: `{ ok: true, order }` or 404

### Dev JSONL persistence

When developing locally, orders are also appended to `data/orders.jsonl`. This is best-effort and ignored in serverless/readonly environments.

- Enabled if `DEV_PERSIST_ORDERS=1` OR `(NODE_ENV !== 'production' && VERCEL !== '1')`
- Read path defaults:
	- In dev persistence mode, GET endpoints default to reading from file unless `from=mem` is specified.
	- You can force file reads via `from=file|fs|disk`.
- `data/` is ignored by git.

### Tiny test harness

A small Node script verifies the handlers without a server:

1. Create an order (POST)
2. List from memory (GET)
3. List from file (GET?from=file)
4. Get by id from file (GET [id]?from=file)

Run:

```
npm run dev:test:order-api
```

If the harness prints "All tests passed.", the minimal API is working locally.
