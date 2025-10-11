import { composeMockupImage } from '@/lib/composeMockupImage';
import { printAreas } from '@/data/products';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function drawText(ctx, text, x, y, opts = {}) {
  const { font = '16px system-ui, -apple-system, Segoe UI, Roboto', color = '#111', align = 'left' } = opts;
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(String(text || ''), x, y);
  ctx.restore();
}

function drawLine(ctx, x1, y1, x2, y2, color = '#e5e7eb', width = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function sortedSizesFromMatrices(matrices) {
  const order = ['3XS','2XS','XS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL','ONE','OS'];
  const set = new Set();
  Object.values(matrices || {}).forEach((m) => Object.keys(m || {}).forEach((k) => set.add(k)));
  const arr = Array.from(set);
  const idx = (s) => {
    const i = order.indexOf(s);
    return i === -1 ? 999 + s.charCodeAt(0) : i;
  };
  return arr.sort((a,b) => idx(a) - idx(b));
}

export async function composeWorksheetImage({
  item,
  language = 'he',
  dropboxLink = '',
  idempotencyKey = '',
}) {
  try {
    // A4-ish at ~150dpi
    const W = 1240; // width px
    const H = 1754; // height px
    const P = 40;   // padding

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Header
    drawText(ctx, language === 'he' ? 'גיליון עבודה' : 'Production Worksheet', P, P, { font: 'bold 28px system-ui', color: '#111' });
    const headerY2 = P + 34;
    const lineY = headerY2 + 10;
    drawLine(ctx, P, lineY, W - P, lineY, '#e5e7eb', 2);

    const productName = item.productName || item.productSku || 'Product';
    const qtyTotal = (() => {
      const matrices = item.sizeMatrices || {};
      return Object.values(matrices).reduce((sum, m) => sum + Object.values(m || {}).reduce((s,q)=>s+(q||0),0), 0);
    })();

    drawText(ctx, `${productName} • Qty: ${qtyTotal}`, P, lineY + 12, { font: 'bold 18px system-ui' });
    if (idempotencyKey) drawText(ctx, `IDEM: ${idempotencyKey}`, W - P, lineY + 12, { font: '14px system-ui', align: 'right', color: '#6b7280' });
    if (dropboxLink) drawText(ctx, dropboxLink, W - P, lineY + 34, { font: '12px system-ui', align: 'right', color: '#2563eb' });

    let y = lineY + 60;

    // Size matrices per color as tables
    const matrices = item.sizeMatrices || {};
    const colors = Object.keys(matrices);
    const sizes = sortedSizesFromMatrices(matrices);

    const tableColW = Math.max(80, Math.floor((W - P*2) / (sizes.length + 1)));
    const rowH = 28;

    for (const color of colors) {
      // Color header
      drawText(ctx, (language === 'he' ? 'צבע: ' : 'Color: ') + color, P, y, { font: 'bold 16px system-ui' });
      y += rowH;
      // Header row
      drawLine(ctx, P, y - 6, W - P, y - 6);
      drawText(ctx, language === 'he' ? 'מידה' : 'Size', P + 6, y, { font: 'bold 14px system-ui', color: '#374151' });
      sizes.forEach((s, i) => {
        drawText(ctx, s, P + (i+1)*tableColW + 6, y, { font: 'bold 14px system-ui', color: '#374151' });
      });
      y += rowH;
      // Values row
      drawText(ctx, '-', P + 6, y, { font: '14px system-ui', color: '#111' });
      sizes.forEach((s, i) => {
        const v = matrices[color]?.[s] || 0;
        drawText(ctx, String(v), P + (i+1)*tableColW + 6, y, { font: '14px system-ui', color: '#111' });
      });
      y += rowH + 10;

      if (y > H - 680) {
        // Avoid overlapping with mockups area; simple stop if too long
        break;
      }
    }

    // Separator
    drawLine(ctx, P, H - 680, W - P, H - 680, '#e5e7eb', 2);

    // Mockup thumbnails grid (2 columns x 2-3 rows)
    let my = H - 660;
    const mx = P;
    const cellW = Math.floor((W - P*2 - 20) / 2);
    const cellH = 300;
    const gaps = 20;

    const areas = (item.selectedPrintAreas || [])
      .map((sel) => (typeof sel === 'string' ? { areaKey: sel, method: 'print' } : sel))
      .filter(Boolean);

    for (let i = 0; i < areas.length; i++) {
      const { areaKey, method } = areas[i];
      const d = (item.uploadedDesigns || {})[areaKey];
      if (!d || !d.url) continue;
      const side = areaKey.startsWith('back') ? 'back' : 'front';
      const baseImage = `/schematics/${side}.png`;
      // Use existing mockup composer at a smaller size
      const mockup = await composeMockupImage({ areaKey, baseImage, designUrl: d.url, width: cellW, height: cellH });

      const col = i % 2;
      const x = mx + col * (cellW + gaps);
      if (col === 0 && i > 0) my += cellH + 40;

      // Frame
      ctx.save();
      ctx.fillStyle = '#f9fafb';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.fillRect(x, my, cellW, cellH);
      ctx.strokeRect(x, my, cellW, cellH);
      ctx.restore();

      // Title
      const label = (language === 'he' ? (printAreas[areaKey]?.labelHe || areaKey) : (printAreas[areaKey]?.label || areaKey)) + (method === 'embo' ? ' • Embo' : '');
      drawText(ctx, label, x + 6, my - 20, { font: 'bold 14px system-ui', color: '#111' });

      if (mockup) {
        const img = await loadImage(mockup);
        ctx.drawImage(img, x, my, cellW, cellH);
      }

      if (my > H - P - cellH) break; // stop if out of page
    }

    // Footer
    drawLine(ctx, P, H - 40, W - P, H - 40, '#e5e7eb', 1);
    drawText(ctx, language === 'he' ? 'הערות: ' : 'Notes: ', P, H - 32, { font: '14px system-ui', color: '#374151' });

    return canvas.toDataURL('image/png');
  } catch (e) {
    return null;
  }
}
