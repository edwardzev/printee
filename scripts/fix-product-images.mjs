import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const publicRoot = path.join(repoRoot, 'public', 'product_images');
const productsPath = path.join(repoRoot, 'src', 'data', 'products.js');
const backupPath = productsPath + '.autofix.bak';

const text = fs.readFileSync(productsPath, 'utf8');
let changed = false;
const found = new Set();
const replaced = [];

// Extract all '/product_images/.../file' occurrences
const re = /['"](\/product_images\/[\w\-\/\._]+?)['"]/g;
let m;
const refs = new Set();
while ((m = re.exec(text)) !== null) {
  refs.add(m[1]);
}

function fileExistsRel(rel) {
  const p = path.join(repoRoot, 'public', rel.replace(/^\//, ''));
  try { return fs.existsSync(p); } catch (e) { return false; }
}

function findCandidate(rel, sku) {
  // rel: /product_images/<folder>/<name> (maybe with or without extension)
  const parts = rel.split('/');
  // parts[0] is '' since leading /
  const folder = parts.slice(2, parts.length-1).join('/');
  const name = parts[parts.length-1];
  const folderPath = path.join(publicRoot, folder);
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) return null;

  const basename = name.replace(/\.[^.]+$/, '');
  const exts = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

  // 1) exact name
  if (fileExistsRel(`/${path.posix.join('product_images', folder, name)}`)) return `/${path.posix.join('product_images', folder, name)}`;

  // 2) basename + extensions
  for (const e of exts) {
    const cand = `/${path.posix.join('product_images', folder, basename + e)}`;
    if (fileExistsRel(cand)) return cand;
  }
  // 3) basename + '_' + sku + ext
  for (const e of exts) {
    const cand = `/${path.posix.join('product_images', folder, `${basename}_${sku}${e}`)}`;
    if (fileExistsRel(cand)) return cand;
  }
  // 4) basename with sku appended before suffix (if basename ends with name like base1 -> base1_sweatshirt already handled), else try name + '_' + sku
  for (const e of exts) {
    const cand = `/${path.posix.join('product_images', folder, name + '_' + sku + e)}`;
    if (fileExistsRel(cand)) return cand;
  }

  // 5) scan directory for something containing basename
  const files = fs.readdirSync(folderPath);
  const lower = basename.toLowerCase();
  for (const f of files) {
    if (f.toLowerCase().includes(lower)) return `/${path.posix.join('product_images', folder, f)}`;
  }

  return null;
}

// Quick heuristic to get sku from nearby text in file: look for pattern "sku: 'xxx'" earlier in text before the match
function guessSkuForRef(rel) {
  const idx = text.indexOf(rel);
  if (idx < 0) return null;
  const before = text.slice(Math.max(0, idx - 400), idx);
  const m = before.match(/sku\s*:\s*['\"]([\w\-]+)['\"]/);
  if (m) return m[1];
  // fallback: infer folder name as sku
  const parts = rel.split('/');
  if (parts.length >= 3) return parts[2];
  return null;
}

// Build a map of replacements
const replacements = new Map();
for (const r of refs) {
  const exists = fileExistsRel(r);
  if (exists) continue;
  const sku = guessSkuForRef(r) || '';
  const cand = findCandidate(r, sku);
  if (cand) {
    replacements.set(r, cand);
    replaced.push({from: r, to: cand});
  }
}

if (replacements.size === 0) {
  console.log('No missing references found or no safe candidates.');
  process.exit(0);
}

// create backup
fs.copyFileSync(productsPath, backupPath);
let out = text;
for (const [from, to] of replacements.entries()) {
  // replace all exact quoted occurrences
  const esc = from.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const qre = new RegExp(`(['\"])${esc}(['\"])`, 'g');
  out = out.replace(qre, `"${to}"`);
  changed = true;
}

if (changed) {
  fs.writeFileSync(productsPath, out, 'utf8');
  console.log('Applied replacements:');
  for (const r of replaced) console.log(r.from, '=>', r.to);
  console.log(`Backup written to ${backupPath}`);
} else {
  console.log('No changes made');
}
