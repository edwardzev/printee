<!-- Project-specific Copilot / AI agent guidance for contributors -->
# Copilot instructions — Printee

Purpose: give AI coding agents the minimal, actionable context needed to be productive in this repo.

- **Big picture**:
  - **Frontend**: Vite + React app lives in `src/` (entry `main.jsx`, styles in `index.css`). Use `npm run dev` to run the dev server and `npm run build` to produce production bundles. `prebuild` runs `scripts/generate-works-manifest.js`.
  - **Serverless API**: All HTTP handlers are simple serverless functions under `api/` (e.g. `api/health.js`, `api/echo.js`, `api/order/*`). Routing behavior is influenced by `vercel.json` rewrites.
  - **Dev persistence**: A minimal in-memory store is used (`api/order/store.js`). When developing locally a file-backed fallback appends JSON lines to `data/orders.jsonl` (enabled when `DEV_PERSIST_ORDERS=1` or when `NODE_ENV !== 'production' && VERCEL !== '1'`). In production, writes/errors are intentionally best-effort and swallowed.

- **Critical workflows / commands** (copyable):
  - Start dev frontend: `npm run dev`
  - Build for production: `npm run build` (runs `prebuild` script first)
  - Run the tiny order API test harness: `npm run dev:test:order-api` (runs `scripts/dev-order-api-test.mjs`)
  - Admin/product scripts live under `scripts/` — examples: `node scripts/apply-product-json.mjs` and `node scripts/dev-admin-server.js`.

- **Key project conventions & patterns**:
  - Handlers export a default async function `(req, res)` that behaves like Express-style handlers. Use `req.query`, `req.body`, and set response `res.status(...).json(...)`.
  - Validation is explicit and centralized: `api/order/validate.js` uses AJV; when validating, return the `{ valid, errors }` shape. When invalid, handlers return `400` with `details`.
  - The order store is intentionally minimal: `api/order/store.js` keeps an in-memory `Map` and appends new orders to `data/orders.jsonl` asynchronously (fire-and-forget). Use `from=mem` or `from=file` query to force source.
  - Files in `data/` are git-ignored and used for local dev only.
  - Project is ESM (`"type":"module"` in `package.json`) — prefer `import`/`export` and modern Node runtimes.

- **Integration points & external dependencies**:
  - Deploy routing: `vercel.json` controls rewrites for `/api/*` and SPA fallthrough.
  - Image and product tooling: `scripts/` contains many image-conversion and product-management utilities (e.g. `convert-images.js`, `convert-hero-images.js`, `apply-product-json.mjs`). These are often run directly via `node` (not npm scripts).
  - Third-party libs of note: `ajv` for validation, `multer` for uploads, `sharp` used by image scripts, and React/Vite for frontend.

- **Examples agents should follow** (concrete snippets):
  - POST /api/order minimal payload accepted by validation (see `api/order/validate.js`):

    {
      "cart": [{ "id": "sku-123", "qty": 1 }],
      "contact": { "email": "buyer@example.com" },
      "totals": { "total": 29.99, "currency": "USD" }
    }

  - To test reading from file vs memory when calling `GET /api/order`: add `?from=file` or `?from=mem` to the request.

- **What to avoid / gotchas** (observed in code):
  - Do not assume file writes succeed in serverless environments — file appends are best-effort and errors are swallowed.
  - Many scripts exist both at repo root and under `printee/` — prefer the top-level `package.json` scripts for common workflows.
  - When editing handlers, preserve the simple `(req, res)` contract and existing response shapes (consumers/tests expect `{ ok: true/false, ... }`).

- **Where to look for more context** (high-value files):
  - `package.json` — scripts and ESM type
  - `vercel.json` — routing and rewrites
  - `api/*` — serverless endpoints; specifically `api/order/{index.js,store.js,validate.js}`
  - `scripts/` — dev tooling and test harness (`dev-order-api-test.mjs`)
  - `data/` — local persistence (`orders.jsonl`) and dev products (`dev-products.json`)

If anything in this file is unclear or you need deeper examples (e.g., more pattern examples in `src/` or guidance on contributing UI changes), tell me which area and I will expand the instructions or merge any existing content you want preserved.
