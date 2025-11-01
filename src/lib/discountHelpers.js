export const DEFAULT_DISCOUNT_RATE = 0.05;

const safeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Derive consistent pricing totals for a cart/configurator item based on
 * whether the discount has been claimed.
 */
export const deriveDiscountedPricing = (item, { discountClaimed = false, defaultRate = DEFAULT_DISCOUNT_RATE } = {}) => {
  if (!item || typeof item !== 'object') {
    return {
      subtotalBefore: 0,
      subtotalAfter: 0,
      discountAmount: 0,
      discountRate: 0,
      discountApplied: false,
    };
  }

  const breakdown = item.priceBreakdown || {};
  const baseMerchandise = safeNumber(
    item.subtotalBeforeDiscount ??
    breakdown.merchandiseTotal ??
    breakdown.baseTotal ??
    0
  );
  const fallbackBefore = safeNumber(item.totalBeforeDiscount);
  const storedDiscountAmount = safeNumber(item.discountAmount);
  const storedTotalAfter = safeNumber(item.subtotalAfterDiscount ?? item.totalPrice);

  let subtotalBefore = baseMerchandise > 0 ? baseMerchandise : fallbackBefore;
  if (subtotalBefore <= 0) {
    const recomputed = storedTotalAfter + storedDiscountAmount;
    if (recomputed > 0) subtotalBefore = recomputed;
  }
  if (subtotalBefore <= 0 && storedTotalAfter > 0) {
    subtotalBefore = storedTotalAfter;
  }
  if (!Number.isFinite(subtotalBefore) || subtotalBefore < 0) {
    subtotalBefore = 0;
  }

  const storedRate = safeNumber(item.discountRate);
  const rateFallback = storedRate > 0 ? storedRate : defaultRate;
  const storedClaimed = Boolean(item.discountClaimed) || storedDiscountAmount > 0;
  const shouldApply = discountClaimed || storedClaimed;

  let discountAmount = storedDiscountAmount;
  let subtotalAfter = storedTotalAfter;

  if (shouldApply && subtotalBefore > 0) {
    discountAmount = Number(Math.min(subtotalBefore * rateFallback, subtotalBefore).toFixed(2));
    subtotalAfter = Math.max(subtotalBefore - discountAmount, 0);
  } else {
    if (discountAmount <= 0) {
      discountAmount = 0;
    }
    if (subtotalAfter <= 0) {
      subtotalAfter = Math.max(subtotalBefore - discountAmount, 0);
    }
  }

  const discountApplied = discountAmount > 0;

  return {
    subtotalBefore,
    subtotalAfter,
    discountAmount,
    discountRate: discountApplied ? rateFallback : 0,
    discountApplied,
  };
};
