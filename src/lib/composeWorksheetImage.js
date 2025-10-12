import { composeMockupImage } from '@/lib/composeMockupImage';
import { printAreas, products } from '@/data/products';

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
  language = 'en',
  dropboxLink = '',
  idempotencyKey = '',
  orderNumber = '',
  customer = {},
  financial = {},
  delivery = {},
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
  drawText(ctx, 'Worksheet', P, P, { font: 'bold 28px system-ui', color: '#111' });
  const orderText = orderNumber ? `Order #${orderNumber}` : (idempotencyKey ? `ID: ${idempotencyKey}` : '');
  if (orderText) drawText(ctx, orderText, W - P, P, { font: 'bold 18px system-ui', color: '#111', align: 'right' });
  const headerY2 = P + 34;
  const lineY = headerY2 + 10;
    drawLine(ctx, P, lineY, W - P, lineY, '#e5e7eb', 2);

    const productName = item.productName || item.productSku || 'Product';
    const qtyTotal = (() => {
      const matrices = item.sizeMatrices || {};
      return Object.values(matrices).reduce((sum, m) => sum + Object.values(m || {}).reduce((s,q)=>s+(q||0),0), 0);
    })();

  // Subheader line with product and link
  drawText(ctx, `${productName} • Qty: ${qtyTotal}`, P, lineY + 12, { font: 'bold 18px system-ui' });
  let y = lineY + 12;
  if (idempotencyKey) { drawText(ctx, `IDEM: ${idempotencyKey}`, W - P, y, { font: '14px system-ui', align: 'right', color: '#6b7280' }); y += 22; } else { y += 22; }
  if (dropboxLink) { drawText(ctx, dropboxLink, W - P, y, { font: '12px system-ui', align: 'right', color: '#2563eb' }); y += 26; }
  y += 12;

  // Customer and Finance blocks
  const colW = Math.floor((W - P*2 - 20) / 2);
  const boxH = 116;
  // Customer
  drawText(ctx, 'Customer', P, y, { font: 'bold 16px system-ui' });
  drawLine(ctx, P, y + 22, P + colW, y + 22);
  drawText(ctx, `Name: ${customer?.name || ''}`, P, y + 30, { font: '14px system-ui' });
  drawText(ctx, `Phone: ${customer?.phone || ''}`, P, y + 50, { font: '14px system-ui' });
  drawText(ctx, `Email: ${customer?.email || ''}`, P, y + 70, { font: '14px system-ui' });
  drawText(ctx, `Address: ${(customer?.address_street || '')} ${(customer?.address_city || '')}`.trim(), P, y + 90, { font: '14px system-ui' });
  // Finance
  const fx = P + colW + 20;
  drawText(ctx, 'Finance', fx, y, { font: 'bold 16px system-ui' });
  drawLine(ctx, fx, y + 22, fx + colW, y + 22);
  drawText(ctx, `Subtotal: ${Number(financial?.subtotal || 0)}`, fx, y + 30, { font: '14px system-ui' });
  drawText(ctx, `Delivery: ${Number(financial?.delivery || 0)}`, fx, y + 50, { font: '14px system-ui' });
  drawText(ctx, `VAT: ${Number(financial?.vat || 0)}`, fx, y + 70, { font: '14px system-ui' });
  drawText(ctx, `Total: ${Number(financial?.total || 0)} (${financial?.payment_method || ''})`, fx, y + 90, { font: 'bold 14px system-ui' });

  y += boxH + 24;

  // Delivery block
  drawText(ctx, 'Delivery', P, y, { font: 'bold 16px system-ui' });
  drawLine(ctx, P, y + 22, W - P, y + 22);
  drawText(ctx, `${delivery?.method || 'Standard'} — ${(delivery?.notes || '').trim()}`, P, y + 30, { font: '14px system-ui' });
  y += 64;

    // Size matrices per color as tables
  const matrices = item.sizeMatrices || {};
  const colors = Object.keys(matrices);
  // derive size range from product catalog (uppercased), union with observed sizes
  const product = (products || []).find(p => p.sku === item.productSku);
  const canonical = (product?.sizeRange || []).map(s => String(s || '').toUpperCase());
  const observed = sortedSizesFromMatrices(matrices).map(s => String(s || '').toUpperCase());
  const sizes = Array.from(new Set([...canonical, ...observed]));

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
        const val = matrices[color]?.[s] ?? matrices[color]?.[String(s).toLowerCase()] ?? matrices[color]?.[String(s).toUpperCase()] ?? 0;
        const show = val ? String(val) : '';
        drawText(ctx, show, P + (i+1)*tableColW + 6, y, { font: '14px system-ui', color: '#111' });
      });
      y += rowH + 10;

      if (y > H - 680) {
        // Avoid overlapping with mockups area; simple stop if too long
        break;
      }
    }

  // Separator before areas, close to whatever height the matrices consumed
  const areasStart = y + 16;
  drawLine(ctx, P, areasStart - 12, W - P, areasStart - 12, '#e5e7eb', 2);

  // Print areas: one area per row, wider blocks; mockup + source side-by-side
  let my = areasStart;
  const mx = P;
  const pairW = Math.floor((W - P * 2));
  const innerGap = 24;
  const cellW = Math.floor((pairW - innerGap) / 2);
  const cellH = 360;
  const rowGap = 40;

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

  // If we're beyond the printable area, stop
  if ((H - P) - my < 120) break;
  // Fit the block height into the remaining space to avoid cutting bottom
  const remaining = (H - P) - my;
  const effH = Math.min(cellH, remaining);
  const xPair = mx;
  if (i > 0 && my !== areasStart) my += rowGap; // add row gap between items

      // Titles
      const label = (language === 'he' ? (printAreas[areaKey]?.labelHe || areaKey) : (printAreas[areaKey]?.label || areaKey)) + (method === 'embo' ? ' • Embo' : '');
  drawText(ctx, label, xPair, my - 18, { font: 'bold 14px system-ui', color: '#111' });
  drawText(ctx, 'Mockup', xPair + 6, my - 2, { font: '12px system-ui', color: '#6b7280' });
  drawText(ctx, 'Design', xPair + cellW + innerGap, my - 2, { font: '12px system-ui', color: '#6b7280' });

      // Frames: mockup (left) and design with gray bg (right)
  const xMock = xPair;
  const xDesign = xPair + cellW + innerGap;
      ctx.save();
      ctx.fillStyle = '#f9fafb';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
  ctx.fillRect(xMock, my, cellW, effH);
  ctx.strokeRect(xMock, my, cellW, effH);
      // Design panel with gray background
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(xDesign, my, cellW, effH);
  ctx.strokeRect(xDesign, my, cellW, effH);
      ctx.restore();

      if (mockup) {
        const img = await loadImage(mockup);
        ctx.drawImage(img, xMock, my, cellW, effH);
      }
      try {
        const di = await loadImage(d.url);
        // fit contain into design cell
        const scale = Math.min(cellW / di.width, effH / di.height);
        const dw2 = Math.round(di.width * scale);
        const dh2 = Math.round(di.height * scale);
        const dx = xDesign + Math.round((cellW - dw2) / 2);
        const dy = my + Math.round((effH - dh2) / 2);
        ctx.drawImage(di, dx, dy, dw2, dh2);
      } catch {}

      // Advance by effective height for next row
      my += effH;
    }

    // Footer
    drawLine(ctx, P, H - 40, W - P, H - 40, '#e5e7eb', 1);
    drawText(ctx, 'Notes: ', P, H - 32, { font: '14px system-ui', color: '#374151' });

    return canvas.toDataURL('image/png');
  } catch (e) {
    return null;
  }
}
