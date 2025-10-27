Dev Admin server (dev-only)
===========================

Purpose
-------
Small local server and static UI to edit a JSON product file at `data/dev-products.json`.

When to use
-----------
- For local development only. Not intended for production.
- Use when you want a quick GUI to create/copy/edit product entries without touching the main codebase.

How to run
----------
1. Install dependencies if you don't already have them (express + cors + body-parser):

```bash
npm install express cors body-parser
```

2. Run the server:

```bash
node scripts/dev-admin-server.js
```

3. Open the editor in your browser:

http://localhost:3333/_local_admin/ui/dev-products-admin.html

Notes
-----
- The server reads/writes `data/dev-products.json`.
- This is intentionally minimal and unsecured. Keep it local and do not expose it to the public.
