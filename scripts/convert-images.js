#!/usr/bin/env node
// scripts/convert-images.js
// Generic image conversion tool (ESM) that re-uses the logic from convert-hero-images
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = process.argv[2] || path.join(__dirname, '..', 'public', 'product_images');
const sizes = [800, 1200, 1600];
const webpQuality = 80;
const avifQuality = 50;

async function run() {
  if (!fs.existsSync(target)) {
    console.error('Target folder does not exist:', target);
    process.exit(1);
  }
  function walk(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) results = results.concat(walk(full));
      else if (/\.(jpe?g|png)$/i.test(e.name)) results.push(full);
    }
    return results;
  }

  const files = walk(target);
  console.log('Converting', files.length, 'images in', target);
  for (const input of files) {
    const rel = path.relative(target, input);
    const base = rel.replace(path.extname(rel), '').replace(/[\\/]/g, '__');
  console.log('Processing', input);
    try {
      const stat = fs.statSync(input);
      if (!stat.isFile() || stat.size === 0) {
        console.warn('Skipping (not a file or empty):', input);
        continue;
      }
      try {
        await sharp(input).metadata();
      } catch (metaErr) {
        console.warn('Skipping (unsupported/corrupt image):', input, metaErr.message);
        continue;
      }
      await sharp(input).webp({ quality: webpQuality }).toFile(path.join(target, `${base}.webp`));
      await sharp(input).avif({ quality: avifQuality }).toFile(path.join(target, `${base}.avif`));
      for (const w of sizes) {
        await sharp(input).resize({ width: w }).webp({ quality: webpQuality }).toFile(path.join(target, `${base}-${w}.webp`));
        await sharp(input).resize({ width: w }).avif({ quality: avifQuality }).toFile(path.join(target, `${base}-${w}.avif`));
      }
    } catch (err) {
      console.error('Failed processing', input, err && err.message ? err.message : err);
      continue;
    }
  }
  console.log('Done converting images in', target);
}

run();
