// scripts/convert-hero-images.js (ESM)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, '..', 'public', 'hero_images');
const sizes = [800, 1200, 1600]; // responsive widths
const jpgQuality = 85;
const webpQuality = 80;
const avifQuality = 50;

(async () => {
  const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png)$/i.test(f));
  for (const file of files) {
    const input = path.join(dir, file);
    const base = path.parse(file).name;
    console.log('Processing', file);
    try {
      const stat = fs.statSync(input);
      if (!stat.isFile() || stat.size === 0) {
        console.warn('Skipping (not a file or empty):', file);
        continue;
      }

      // quick metadata check to ensure sharp can read it
      try {
        await sharp(input).metadata();
      } catch (metaErr) {
        console.warn('Skipping (unsupported/corrupt image):', file, metaErr.message);
        continue;
      }

      // create baseline webp/avif same size
      await sharp(input).webp({ quality: webpQuality }).toFile(path.join(dir, `${base}.webp`));
      await sharp(input).avif({ quality: avifQuality }).toFile(path.join(dir, `${base}.avif`));
      // create responsive variants
      for (const w of sizes) {
        const outName = `${base}-${w}.webp`;
        const outAvif = `${base}-${w}.avif`;
        await sharp(input).resize({ width: w }).webp({ quality: webpQuality }).toFile(path.join(dir, outName));
        await sharp(input).resize({ width: w }).avif({ quality: avifQuality }).toFile(path.join(dir, outAvif));
      }
    } catch (err) {
      console.error('Failed processing', file, err && err.message ? err.message : err);
      // continue with next file
      continue;
    }
  }
  console.log('Done.');
})();