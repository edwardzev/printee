#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (e.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function isRasterImage(file) {
  return /\.(jpe?g|png)$/i.test(file);
}

async function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function convertFile(file, outWebp, outAvif) {
  try {
    const img = sharp(file, { failOnError: false });
    // Create webp if missing
    try {
      await fs.access(outWebp);
      console.log('skip (webp exists)', outWebp);
    } catch (e) {
      await img.clone().webp({ quality: 80 }).toFile(outWebp);
      console.log('created', outWebp);
    }
    // Create avif if missing
    try {
      await fs.access(outAvif);
      console.log('skip (avif exists)', outAvif);
    } catch (e) {
      await img.clone().avif({ quality: 50 }).toFile(outAvif);
      console.log('created', outAvif);
    }
  } catch (err) {
    console.error('error converting', file, err.message || err);
  }
}

async function run(baseDir) {
  console.log('Scanning', baseDir);
  const allFiles = await walk(baseDir);
  const rasterFiles = allFiles.filter(isRasterImage);
  console.log(`Found ${rasterFiles.length} raster images to check.`);

  // simple concurrency pool
  const concurrency = 6;
  let index = 0;

  async function worker() {
    while (index < rasterFiles.length) {
      const i = index++;
      const file = rasterFiles[i];
      const ext = path.extname(file);
      const base = file.slice(0, -ext.length);
      const outWebp = `${base}.webp`;
      const outAvif = `${base}.avif`;
      await ensureDirExists(outWebp);
      await convertFile(file, outWebp, outAvif);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, rasterFiles.length) }, worker).map(p => p);
  await Promise.all(workers);
  console.log('Done.');
}

const dirArg = process.argv[2] || path.join(__dirname, '..', 'public', 'product_images');
run(path.resolve(dirArg)).catch(err => {
  console.error(err);
  process.exit(1);
});
