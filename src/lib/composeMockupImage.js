import { printAreas, templatePresets } from '@/data/products';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

// Compose base schematic (front/back) with the uploaded design placed into the overlay rect based on templatePresets or printAreas fallback.
// Returns a PNG data URL.
export async function composeMockupImage({ areaKey, baseImage, designUrl, template = 'tshirt', width = 800, height = 800, background = '#f6f7f9' }) {
  if (!areaKey || !baseImage || !designUrl) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Draw base schematic scaled to fit contain
    const baseImg = await loadImage(baseImage);
    const baseRatio = baseImg.width / baseImg.height;
    const targetRatio = width / height;
    let dw, dh, dx, dy;
    if (baseRatio > targetRatio) {
      // limited by width
      dw = width; dh = Math.round(width / baseRatio); dx = 0; dy = Math.round((height - dh) / 2);
    } else {
      dh = height; dw = Math.round(height * baseRatio); dy = 0; dx = Math.round((width - dw) / 2);
    }
    ctx.drawImage(baseImg, dx, dy, dw, dh);

    // Compute overlay rect percentages
    const area = printAreas[areaKey] || {};
    const preset = (templatePresets?.[template] && templatePresets[template]?.[areaKey]) || null;
    const overlay = preset ? {
      x: (preset.x / 100) * width,
      y: (preset.y / 100) * height,
      w: (preset.w / 100) * width,
      h: (preset.h / 100) * height,
      rot: preset.rot || 0,
    } : {
      x: (area.overlayX / 800) * width,
      y: (area.overlayY / 800) * height,
      w: (area.overlayW / 800) * width,
      h: (area.overlayH / 800) * height,
      rot: area.overlayRot || 0,
    };

    // Draw design contained inside overlay rect with rotation. If the source fails to load
    // (for example when the uploaded file is a PDF), render a simple placeholder so the
    // mockup frame is not left empty.
    let designImg = null;
    try {
      designImg = await loadImage(designUrl);
    } catch (err) {
      designImg = null;
    }
    ctx.save();
    ctx.translate(overlay.x + overlay.w/2, overlay.y + overlay.h/2);
    if (overlay.rot) ctx.rotate((overlay.rot * Math.PI) / 180);
    if (designImg) {
      // fit contain into overlay
      const scale = Math.min(overlay.w / designImg.width, overlay.h / designImg.height);
      const dw2 = Math.round(designImg.width * scale);
      const dh2 = Math.round(designImg.height * scale);
      ctx.drawImage(designImg, -dw2/2, -dh2/2, dw2, dh2);
    } else {
      // Draw placeholder rectangle and label for non-image uploads (PDFs)
      const pw = Math.floor(overlay.w * 0.9);
      const ph = Math.floor(overlay.h * 0.9);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.fillRect(-pw/2, -ph/2, pw, ph);
      ctx.strokeRect(-pw/2, -ph/2, pw, ph);
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto';
      ctx.fillText('PDF preview not available', 0, 0);
    }
    ctx.restore();

    return canvas.toDataURL('image/png');
  } catch (e) {
    return null;
  }
}
