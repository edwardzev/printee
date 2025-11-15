import fs from 'fs';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB per file
  }
});

export const config = {
  api: {
    bodyParser: false
  }
};

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

function sanitizeKey(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_');
}

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function convertBuffer(buffer, ext) {
  if (ext === '.pdf') {
    return sharp(buffer, { density: 300 }).png().toBuffer();
  }
  return buffer;
}

async function writeImageVariants(baseBuffer, targetDir, baseName) {
  const avifPath = path.join(targetDir, `${baseName}.avif`);
  const webpPath = path.join(targetDir, `${baseName}.webp`);

  await sharp(baseBuffer)
    .avif({ quality: 55 })
    .toFile(avifPath);

  await sharp(baseBuffer)
    .webp({ quality: 85 })
    .toFile(webpPath);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return res.status(501).json({
      error: 'Not Implemented',
      details:
        'Automatic uploads require filesystem access and only work in local development. Please upload files locally and commit them to the repo.'
    });
  }

  try {
    await runMiddleware(req, res, upload.any());
  } catch (error) {
    console.error('Upload middleware error:', error);
    return res.status(500).json({ error: 'Failed to parse upload', details: error.message });
  }

  const sku = (req.body?.sku || '').trim();
  if (!sku) {
    return res.status(400).json({ error: 'SKU is required for uploads' });
  }

  if (!Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const targetDir = path.join(process.cwd(), 'public', 'product_images', sku);
    await ensureDir(targetDir);

    const result = {};

    for (const file of req.files) {
      const fieldKey = sanitizeKey(file.fieldname);
      if (!fieldKey) continue;

      const originalExt = (path.extname(file.originalname) || '.png').toLowerCase();
      const baseName = `${fieldKey}_${sku}`;
      const rasterBuffer = await convertBuffer(file.buffer, originalExt);
      const originalTargetExt = originalExt === '.pdf' ? '.png' : originalExt;
      const originalPath = path.join(targetDir, `${baseName}${originalTargetExt}`);

      await fs.promises.writeFile(originalPath, rasterBuffer);
      await writeImageVariants(rasterBuffer, targetDir, baseName);

      result[fieldKey] = [
        `/product_images/${sku}/${baseName}.avif`,
        `/product_images/${sku}/${baseName}.webp`,
        `/product_images/${sku}/${baseName}${originalTargetExt}`
      ];
    }

    return res.status(200).json({ success: true, images: result });
  } catch (error) {
    console.error('Failed to process uploads:', error);
    return res.status(500).json({ error: 'Image processing failed', details: error.message });
  }
}
