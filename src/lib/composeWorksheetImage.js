import { composeMockupImage } from '@/lib/composeMockupImage';
import { printAreas, products } from '@/data/products';

// Centralized typography theme for worksheet
const THEME = {
  family: 'system-ui, -apple-system, Segoe UI, Roboto',
  sizes: {
    title: 38,          // Main title "Worksheet"
    order: 38,          // Order number / ID at top-right
    product: 38,        // Product name + Qty line
    section: 26,        // Section headers: Customer, Finance
    text: 24,           // Main body text in sections
    deliveryTitle: 26,  // Delivery header
    deliveryText: 20,   // Delivery body and footer notes
    tableHeader: 30,    // Table headers (size labels)
    tableCell: 24,      // Table values
    hint: 22,           // Small hints (e.g., link, mockup/design captions)
    areaLabel: 30,      // Area label above mockup row
  },
};

function font(sizeKey, weight = 'normal') {
  const sz = THEME.sizes[sizeKey] || THEME.sizes.text;
  const w = weight === 'bold' ? 'bold ' : '';
  return `${w}${sz}px ${THEME.family}`;
}

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
  const { font: f = font('text'), color = '#111', align = 'left' } = opts;
  ctx.save();
  ctx.font = f;
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
  // when true, returns { dataUrl, consumed } with counts for pagination
  returnMeta = false,
  startColorIndex = 0,
  startAreaIndex = 0,
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
  drawText(ctx, 'Worksheet', P, P, { font: font('title', 'bold'), color: '#111' });
  const orderText = orderNumber ? `Order #${orderNumber}` : (idempotencyKey ? `ID: ${idempotencyKey}` : '');
  if (orderText) drawText(ctx, orderText, W - P, P, { font: font('order', 'bold'), color: '#111', align: 'right' });
  const headerY2 = P + 34;
  const lineY = headerY2 + 20;
    drawLine(ctx, P, lineY, W - P, lineY, '#e5e7eb', 2);

    const productName = item.productName || item.productSku || 'Product';
    const qtyTotal = (() => {
      const matrices = item.sizeMatrices || {};
      return Object.values(matrices).reduce((sum, m) => sum + Object.values(m || {}).reduce((s,q)=>s+(q||0),0), 0);
    })();

  // Subheader line with product and link
  drawText(ctx, `${productName} • Qty: ${qtyTotal}`, P, lineY + 12, { font: font('product', 'bold') });
  let y = lineY + 12;
  const gapSmall = Math.round(THEME.sizes.deliveryText * 1.2);
  const gapHint = Math.round(THEME.sizes.hint * 1.2);
  if (idempotencyKey) { drawText(ctx, `IDEM: ${idempotencyKey}`, W - P, y, { font: font('deliveryText'), align: 'right', color: '#6b7280' }); y += gapSmall; } else { y += gapSmall; }
  if (dropboxLink) { drawText(ctx, dropboxLink, W - P, y, { font: font('hint'), align: 'right', color: '#2563eb' }); y += gapHint; }
  y += gapSmall;

  // Customer and Finance blocks
  const colW = Math.floor((W - P*2 - 20) / 2);
  const boxH = 116;
  const gapText = Math.round(THEME.sizes.text * 1.4);
  // Customer
  drawText(ctx, 'Customer', P, y, { font: font('section', 'bold') });
  drawLine(ctx, P, y + 22, P + colW, y + 22);
  let cy = y + 30;
  drawText(ctx, `Name: ${customer?.name || ''}`, P, cy, { font: font('text') });
  cy += gapText;
  drawText(ctx, `Phone: ${customer?.phone || ''}`, P, cy, { font: font('text') });
  cy += gapText;
  drawText(ctx, `Email: ${customer?.email || ''}`, P, cy, { font: font('text') });
  cy += gapText;
  drawText(ctx, `Address: ${(customer?.address_street || '')} ${(customer?.address_city || '')}`.trim(), P, cy, { font: font('text') });
  // Finance
  const fx = P + colW + 20;
  drawText(ctx, 'Finance', fx, y, { font: font('section', 'bold') });
  drawLine(ctx, fx, y + 22, fx + colW, y + 22);
  let fy = y + 30;
  drawText(ctx, `Subtotal: ${Number(financial?.subtotal || 0)}`, fx, fy, { font: font('text') });
  fy += gapText;
  drawText(ctx, `Delivery: ${Number(financial?.delivery || 0)}`, fx, fy, { font: font('text') });
  fy += gapText;
  drawText(ctx, `VAT: ${Number(financial?.vat || 0)}`, fx, fy, { font: font('text') });
  fy += gapText;
  drawText(ctx, `Total: ${Number(financial?.total || 0)} (${financial?.payment_method || ''})`, fx, fy, { font: font('text', 'bold') });

  // Advance by the max of actual used height and a minimum box height
  const custBottom = cy + THEME.sizes.text;
  const finBottom = fy + THEME.sizes.text;
  const usedH = Math.max(custBottom, finBottom) - y;
  y += Math.max(usedH, boxH) + 24;

  // Delivery block
  drawText(ctx, 'Delivery', P, y, { font: font('deliveryTitle', 'bold') });
  drawLine(ctx, P, y + 22, W - P, y + 22);
  drawText(ctx, `${delivery?.method || 'Standard'} — ${(delivery?.notes || '').trim()}`, P, y + 30, { font: font('deliveryText') });
  y += 64;

    // Size matrices per color as tables
  const matrices = item.sizeMatrices || {};
  const colors = Object.keys(matrices);
  let colorsRendered = 0;
  // derive size range from product catalog (uppercased), union with observed sizes
  const product = (products || []).find(p => p.sku === item.productSku);
  const canonical = (product?.sizeRange || []).map(s => String(s || '').toUpperCase());
  const observed = sortedSizesFromMatrices(matrices).map(s => String(s || '').toUpperCase());
  const sizes = Array.from(new Set([...canonical, ...observed]));

  const tableColW = Math.max(80, Math.floor((W - P*2) / (sizes.length + 1)));
  const rowH = Math.max(24, Math.round(THEME.sizes.tableCell * 1.6));

    for (let ci = startColorIndex; ci < colors.length; ci++) {
      const color = colors[ci];
      // Color header
      drawText(ctx, (language === 'he' ? 'צבע: ' : 'Color: ') + color, P, y, { font: font('deliveryTitle', 'bold') });
      y += rowH;
      // Header row
      drawLine(ctx, P, y - 6, W - P, y - 6);
      drawText(ctx, language === 'he' ? 'מידה' : 'Size', P + 6, y, { font: font('tableHeader', 'bold'), color: '#374151' });
      sizes.forEach((s, i) => {
        drawText(ctx, s, P + (i+1)*tableColW + 6, y, { font: font('tableHeader', 'bold'), color: '#374151' });
      });
      y += rowH;
      // Values row
      drawText(ctx, '-', P + 6, y, { font: font('tableCell'), color: '#111' });
      sizes.forEach((s, i) => {
        const val = matrices[color]?.[s] ?? matrices[color]?.[String(s).toLowerCase()] ?? matrices[color]?.[String(s).toUpperCase()] ?? 0;
        const show = val ? String(val) : '';
        drawText(ctx, show, P + (i+1)*tableColW + 6, y, { font: font('tableCell'), color: '#111' });
      });
      y += rowH + 10;

      if (y > H - 680) {
        // Avoid overlapping with mockups area; simple stop if too long
        colorsRendered += 1;
        break;
      }
      colorsRendered += 1;
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
  const rowGap = Math.round(THEME.sizes.areaLabel * 1.8);
  const labelH = THEME.sizes.areaLabel;
  const hintH = THEME.sizes.hint;
  const titleBlockH = Math.round(labelH + hintH + 10);

    const areas = (item.selectedPrintAreas || [])
      .map((sel) => (typeof sel === 'string' ? { areaKey: sel, method: 'print' } : sel))
      .filter(Boolean);
    let areasRendered = 0;

    for (let i = startAreaIndex; i < areas.length; i++) {
      const { areaKey, method } = areas[i];
      const d = (item.uploadedDesigns || {})[areaKey];
      if (!d || !d.url) continue;
      const side = areaKey.startsWith('back') ? 'back' : 'front';
      const baseImage = `/schematics/${side}.png`;
    // Use existing mockup composer at a smaller size
  let mockup = null;
  try {
    mockup = await composeMockupImage({ areaKey, baseImage, designUrl: d.url, width: cellW, height: cellH });
  } catch (e) {
    mockup = null;
  }

  // If we're beyond the printable area, stop
  const infoLineH = Math.round(THEME.sizes.deliveryText * 1.5);
  if ((i > startAreaIndex) && my !== areasStart) my += rowGap; // add row gap between items
  // Ensure there's enough space for titles + a minimal frame height
  if ((H - P) - my < titleBlockH + 120) break;
  // Fit the block height into the remaining space to avoid cutting bottom, reserving space for title and info lines
  const frameTop = my + titleBlockH;
  const remaining = (H - P) - frameTop;
  const effH = Math.min(cellH, Math.max(0, remaining - infoLineH));
  const xPair = mx;

    // Titles (above frames)
    const label = (language === 'he' ? (printAreas[areaKey]?.labelHe || areaKey) : (printAreas[areaKey]?.label || areaKey)) + (method === 'embo' ? ' • Embo' : '');
  drawText(ctx, label, xPair, my, { font: font('areaLabel', 'bold'), color: '#111' });
  drawText(ctx, language === 'he' ? 'מוקאפ' : 'Mockup', xPair + 6, my + labelH + 4, { font: font('hint'), color: '#6b7280' });
  drawText(ctx, language === 'he' ? 'עיצוב' : 'Design', xPair + cellW + innerGap, my + labelH + 4, { font: font('hint'), color: '#6b7280' });

    // Frames: mockup (left) and design with gray bg (right)
  const xMock = xPair;
  const xDesign = xPair + cellW + innerGap;
      ctx.save();
      ctx.fillStyle = '#f9fafb';
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
  ctx.fillRect(xMock, frameTop, cellW, effH);
  ctx.strokeRect(xMock, frameTop, cellW, effH);
      // Design panel with gray background
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(xDesign, frameTop, cellW, effH);
  ctx.strokeRect(xDesign, frameTop, cellW, effH);
      ctx.restore();

      if (mockup) {
        try {
          const img = await loadImage(mockup);
          ctx.drawImage(img, xMock, frameTop, cellW, effH);
        } catch {}
      }
      // Try to render the uploaded design; if it's a PDF or fails to load, draw a placeholder
      try {
        const di = await loadImage(d.url);
        // fit contain into design cell
        const scale = Math.min(cellW / di.width, effH / di.height);
        const dw2 = Math.round(di.width * scale);
        const dh2 = Math.round(di.height * scale);
        const dx = xDesign + Math.round((cellW - dw2) / 2);
        const dy = frameTop + Math.round((effH - dh2) / 2);
        ctx.drawImage(di, dx, dy, dw2, dh2);
      } catch {
        // Draw placeholder for unsupported design previews (e.g., PDFs)
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        const pw = Math.floor(cellW * 0.9);
        const ph = Math.floor(effH * 0.9);
        const px = xDesign + Math.round((cellW - pw) / 2);
        const py = frameTop + Math.round((effH - ph) / 2);
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeRect(px, py, pw, ph);
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto';
        ctx.fillText('PDF preview not available', px + pw / 2, py + ph / 2);
        ctx.restore();
      }

  // Info line: print color and designer notes
  const sel = areas[i];
  const pColor = sel?.printColor ? String(sel.printColor) : '';
  const notes = sel?.designerComments ? String(sel.designerComments) : '';
  const infoText = language === 'he'
    ? `צבע הדפסה: ${pColor || '-'}  ·  הערות למעצב: ${notes || '-'}`
    : `Print color: ${pColor || '-'}  ·  Notes: ${notes || '-'}`;
  drawText(ctx, infoText, xPair, frameTop + effH + 4, { font: font('deliveryText'), color: '#374151' });

  // Advance by effective height + info line for next row
  my += titleBlockH + effH + infoLineH;
  areasRendered += 1;
    }

    // Footer
  drawLine(ctx, P, H - 40, W - P, H - 40, '#e5e7eb', 1);
  drawText(ctx, 'Notes: ', P, H - 32, { font: font('deliveryText'), color: '#374151' });

    const url = canvas.toDataURL('image/png');
    if (returnMeta) return { dataUrl: url, consumed: { colors: colorsRendered, areas: areasRendered } };
    return url;
  } catch (e) {
    return returnMeta ? { dataUrl: null, consumed: { colors: 0, areas: 0 } } : null;
  }
}
