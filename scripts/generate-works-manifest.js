import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';

// Reads files from public/hero_images/works_page and writes a manifest.json
async function generate() {
  const dir = join(process.cwd(), 'public', 'hero_images', 'works_page');
  try {
    const files = await readdir(dir, { withFileTypes: true });
    const images = files
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .filter((name) => /\.(avif|webp|jpg|jpeg|png|gif)$/i.test(name))
      .sort();

    const manifest = images.map((name) => `/hero_images/works_page/${name}`);

    const outPath = join(dir, 'manifest.json');
    await writeFile(outPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`Generated works manifest with ${manifest.length} files at ${outPath}`);
  } catch (err) {
    console.error('Failed to generate works manifest:', err.message);
    process.exitCode = 1;
  }
}

generate();
