import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * PricingTiers
 * Props:
 * - tiers: Array<{ min: number, max: number, price: number }>
 * - currentQty: number
 * - basePrice?: number (optional, used when tiers absent)
 */
const PricingTiers = ({ tiers = [], currentQty = 0, basePrice }) => {
  const { language } = useLanguage();

  const rows = Array.isArray(tiers) && tiers.length > 0
    ? tiers
    : (typeof basePrice === 'number'
        ? [{ min: 1, max: Infinity, price: basePrice }]
        : []);

  const fmtQtyRange = (min, max) => {
    const isInf = max === Infinity;
    if (language === 'he') {
      return isInf ? `${min}+` : `${min}–${max}`;
    }
    return isInf ? `${min}+` : `${min}–${max}`;
  };

  const perUnitLabel = language === 'he' ? 'ליחידה' : 'per unit';
  const headerTitle = language === 'he' ? 'טבלת מחירים' : 'Pricing table';
  const qtyLabel = language === 'he' ? 'כמות' : 'Qty';
  const priceLabel = language === 'he' ? 'מחיר' : 'Price';

  return (
    <div className="mt-4">
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="px-3 py-2 bg-gray-50 border-b text-sm font-medium text-gray-700">{headerTitle}</div>
        <div className="divide-y">
          <div className="grid grid-cols-2 text-xs font-medium text-gray-500 px-3 py-2">
            <div>{qtyLabel}</div>
            <div className="text-right">{priceLabel} <span className="text-gray-400">({perUnitLabel})</span></div>
          </div>
          {rows.map((r, i) => {
            const active = currentQty >= r.min && currentQty <= r.max;
            return (
              <div
                key={`${r.min}-${r.max}-${i}`}
                className={`grid grid-cols-2 items-center px-3 py-2 text-sm ${active ? 'bg-blue-50' : ''}`}
              >
                <div className="text-gray-800">{fmtQtyRange(r.min, r.max)}</div>
                <div className="text-right font-medium text-gray-900">₪{r.price}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingTiers;
