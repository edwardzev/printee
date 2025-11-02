/**
 * Build uploads list from cart items for Airtable webhook
 * Extracts design files and metadata from cart items
 * 
 * @param {Array} cartItems - Array of cart item objects
 * @returns {Array} Array of upload objects with areaKey, method, product, colors, qty, dataUrl, fileName
 */
export function buildUploadsFromCart(cartItems) {
  try {
    const list = [];
    (cartItems || []).forEach((item) => {
      const product = item.productSku || item.product || 'product';
      const matrices = item.sizeMatrices || {};
      // Determine active colors and their total qty
      let colors = item.selectedColors && Array.isArray(item.selectedColors) && item.selectedColors.length
        ? item.selectedColors
        : (item.color ? [item.color] : []);
      if (colors.length === 0) return;

      // Reduce to active colors with qty > 0
      const activeColors = [];
      let totalQtyForItem = 0;
      colors.forEach((c) => {
        const mat = (matrices && matrices[c]) || (c === item.color ? (item.sizeMatrix || {}) : {});
        const qty = Object.values(mat || {}).reduce((s, q) => s + (q || 0), 0);
        if (qty > 0) {
          activeColors.push(c);
          totalQtyForItem += qty;
        }
      });
      if (activeColors.length === 0) return;

      // Map areaKey -> method
      const areaMethod = {};
      (item.selectedPrintAreas || []).forEach((sel) => {
        if (!sel) return;
        if (typeof sel === 'string') areaMethod[sel] = 'print';
        else if (sel.areaKey) areaMethod[sel.areaKey] = sel.method || 'print';
      });

      const designs = item.uploadedDesigns || {};
      Object.keys(designs).forEach((areaKey) => {
        const d = designs[areaKey];
        if (!d || !d.url) return;
        const method = areaMethod[areaKey] || 'print';
        const fileName = d.name || `${areaKey}.png`;
        // Prefer originalUrl (PDF) if present; fallback to preview url
        const dataUrl = (d.originalUrl && typeof d.originalUrl === 'string') ? d.originalUrl : d.url;
        list.push({
          areaKey,
          method,
          product,
          colors: activeColors,
          qty: totalQtyForItem,
          dataUrl,
          fileName,
        });
      });
    });
    return list;
  } catch (e) {
    console.error('Error building uploads from cart:', e);
    return [];
  }
}
