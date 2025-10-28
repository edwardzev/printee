// scripts/convert-hero-images.js (Modified to process files from 'input' folder and output to 'hero_images' without resizing)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputDir = path.join(__dirname, '..', 'public', 'hero_images', 'input'); // Input folder
const outputDir = path.join(__dirname, '..', 'public', 'hero_images'); // Output folder
const webpQuality = 80;
const avifQuality = 50;

(async () => {
  const files = fs.readdirSync(inputDir).filter(f => /\.(jpe?g|png)$/i.test(f));
  for (const file of files) {
    const input = path.join(inputDir, file);
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
      await sharp(input).webp({ quality: webpQuality }).toFile(path.join(outputDir, `${base}.webp`));
      await sharp(input).avif({ quality: avifQuality }).toFile(path.join(outputDir, `${base}.avif`));
    } catch (err) {
      console.error('Failed processing', file, err && err.message ? err.message : err);
      // continue with next file
      continue;
    }
  }
  console.log('Done.');
})();