/**
 * Build a sanitized cart items payload suitable for Airtable storage.
 * Removes non-serializable values (e.g. File/blob references) and normalizes
 * shapes across legacy/new cart item structures.
 *
 * @param {Array} cartItems - Cart items from the cart context.
 * @returns {Array} Sanitized cart items array.
 */
export function buildCartItemsForAirtable(cartItems) {
  try {
    return (Array.isArray(cartItems) ? cartItems : []).map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const selectedPrintAreas = (item.selectedPrintAreas || []).map((sel) => {
        if (!sel) return null;
        if (typeof sel === 'string') {
          return {
            areaKey: sel,
            method: 'print',
            printColor: 'as-is',
            designerComments: '',
          };
        }
        return {
          areaKey: sel.areaKey || '',
          method: sel.method || 'print',
          printColor: sel.printColor || 'as-is',
          designerComments: sel.designerComments || '',
        };
      }).filter(Boolean);

      const sizeMatrices = (item.sizeMatrices && typeof item.sizeMatrices === 'object')
        ? item.sizeMatrices
        : (item.color ? { [item.color]: (item.sizeMatrix || {}) } : {});

      return {
        productSku: item.productSku || item.product || '',
        productName: item.productName || item.name || '',
        colors: Array.isArray(item.selectedColors) && item.selectedColors.length
          ? item.selectedColors
          : (item.color ? [item.color] : []),
        sizeMatrices,
        selectedPrintAreas,
        unitPrice: Number.isFinite(item.unitPrice) ? Number(item.unitPrice) : null,
        totalPrice: Number.isFinite(item.totalPrice) ? Number(item.totalPrice) : null,
        notes: item.notes || '',
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('Failed to build Airtable cart items payload:', error);
    return [];
  }
}
