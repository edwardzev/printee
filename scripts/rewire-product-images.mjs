#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_FILE = path.resolve(__dirname, '..', 'src', 'data', 'products.js');
const PUBLIC_IMAGES = path.resolve(__dirname, '..', 'public', 'product_images');

function isRaster(s) {
  return /\.(jpe?g|png)$/i.test(s);
}

function swapExt(p, ext) {
  return p.replace(/\.[^.]+$/, ext);
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch (e) {
    return false;
  }
}

async function prioritize(pathStr) {
  // pathStr is like '/product_images/sweatshirt/white_sweatshirt.jpg'
  if (!pathStr || typeof pathStr !== 'string' || !pathStr.startsWith('/product_images')) return pathStr;
  if (!isRaster(pathStr)) return pathStr;
  const rel = pathStr.replace(/^\//, ''); // product_images/...
  const abs = path.join(path.resolve(__dirname, '..'), 'public', rel);
  const avif = swapExt(pathStr, '.avif');
  const webp = swapExt(pathStr, '.webp');
  const absAvif = swapExt(abs, '.avif');
  const absWebp = swapExt(abs, '.webp');

  const hasAvif = await fileExists(absAvif);
  const hasWebp = await fileExists(absWebp);
  const out = [];
  if (hasAvif) out.push(avif);
  if (hasWebp && !out.includes(webp)) out.push(webp);
  if (!out.includes(pathStr)) out.push(pathStr);
  return out;
}

async function transformProducts() {
  const txt = await fs.readFile(PRODUCTS_FILE, 'utf8');
  const marker = 'export const products =';
  const idx = txt.indexOf(marker);
  if (idx === -1) throw new Error('products export not found');
  const arrStart = txt.indexOf('[', idx);
  if (arrStart === -1) throw new Error('products array start not found');

  // find matching closing bracket for the products array
  let depth = 0;
  let i = arrStart;
  for (; i < txt.length; i++) {
    const ch = txt[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (depth !== 0) throw new Error('could not find end of products array');
  const arrEnd = i;
  const productsText = txt.slice(arrStart, arrEnd + 1);

  // evaluate the products array in a sandboxed way using Function
  // convert export-style JS to JSON-compatible by replacing single backticks? We'll use a tolerant eval.
  // WARNING: this runs repository code; assume trusted.
  const moduleText = 'return ' + productsText + ';';
  let products;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(moduleText);
    products = fn();
  } catch (err) {
    throw new Error('Failed to parse products array: ' + err.message);
  }

  // transform products in memory
  for (const p of products) {
    if (!p.images || typeof p.images !== 'object') continue;
    const keys = Object.keys(p.images);
    for (const k of keys) {
      const val = p.images[k];
      if (Array.isArray(val)) {
        // for each original path, compute prioritized list and then flatten unique while preserving order
        const lists = await Promise.all(val.map(v => prioritize(v)));
        const flat = [];
        for (const l of lists) {
          if (Array.isArray(l)) {
            for (const it of l) if (!flat.includes(it)) flat.push(it);
          } else if (l && !flat.includes(l)) flat.push(l);
        }
        p.images[k] = flat;
      } else if (typeof val === 'string') {
        p.images[k] = await prioritize(val);
      }
    }
  }

  // backup original file
  await fs.copyFile(PRODUCTS_FILE, PRODUCTS_FILE + '.bak');

  // produce replacement text for products export
  const serialized = JSON.stringify(products, null, 2).replace(/"/g, '"');
  // rebuild file: replace the products array with the serialized JS (use single quotes where helpful)
  const newTxt = txt.slice(0, arrStart) + serialized + txt.slice(arrEnd + 1);
  await fs.writeFile(PRODUCTS_FILE, newTxt, 'utf8');
  console.log('Rewrote', PRODUCTS_FILE, 'and backed up to', PRODUCTS_FILE + '.bak');
}

transformProducts().catch(err => {
  console.error(err);
  process.exit(1);
});
