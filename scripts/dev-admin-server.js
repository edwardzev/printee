#!/usr/bin/env node
// Simple dev-only admin server to read/write data/dev-products.json
// Usage: node scripts/dev-admin-server.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import multer from 'multer';

const PORT = process.env.DEV_ADMIN_PORT || 3333;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'dev-products.json');
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'dev_uploads');

// ensure upload dir exists
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (err) {}

// serve uploaded files for preview
app.use('/_local_admin/uploads', express.static(UPLOAD_DIR));

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safe);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// serve the static admin UI
app.use('/_local_admin/ui', express.static(path.join(__dirname)));

function readData() {
  try {
    const txt = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(txt);
  } catch (err) {
    return [];
  }
}

function writeData(obj) {
  const tmp = JSON.stringify(obj, null, 2);
  fs.writeFileSync(DATA_FILE, tmp, 'utf8');
}

app.get('/_local_admin/products', (req, res) => {
  const data = readData();
  res.json({ ok: true, products: data });
});

// meta endpoint
app.get('/_local_admin/meta', (req, res) => {
  try {
    const metaPath = path.join(__dirname, '..', 'data', 'dev-products-meta.json');
    const txt = fs.readFileSync(metaPath, 'utf8');
    const meta = JSON.parse(txt);
    return res.json({ ok: true, meta });
  } catch (err) {
    return res.json({ ok: false, error: String(err) });
  }
});

// also serve the meta JSON file directly (some clients may prefer .json)
app.get('/_local_admin/meta.json', (req, res) => {
  try {
    const metaPath = path.join(__dirname, '..', 'data', 'dev-products-meta.json');
    return res.sendFile(metaPath);
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post('/_local_admin/products', (req, res) => {
  const payload = req.body;
  if (!payload || !Array.isArray(payload.products)) {
    return res.status(400).json({ ok: false, error: 'payload must be { products: [...] }' });
  }
  try {
    writeData(payload.products);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// upload endpoint (multipart/form-data, field name: file)
app.post('/_local_admin/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'no file uploaded' });
  const filename = req.file.filename;
  // return a URL path clients can use to reference the uploaded file
  const urlPath = '/_local_admin/uploads/' + encodeURIComponent(filename);
  return res.json({ ok: true, filename, url: urlPath });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><meta charset="utf-8"><title>Dev Admin</title></head>
      <body>
        <p>Dev admin server running. UI: <a href="/_local_admin/ui/dev-products-admin.html">Open editor</a></p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`[dev-admin] running on http://localhost:${PORT}/ - UI: /_local_admin/ui/dev-products-admin.html`);
});
