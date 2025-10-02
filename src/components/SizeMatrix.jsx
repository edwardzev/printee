import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const SizeMatrix = ({ sizeRange = [], sizeMatrix = {}, onChange }) => {
  const { t } = useLanguage();

  const safeOnChange = (updater) => {
    try {
      if (typeof onChange === 'function') {
        onChange(updater);
      } else {
        // If onChange isn't provided, silently ignore to avoid crashes
        // This can happen if parent passes a non-function accidentally.
        // eslint-disable-next-line no-console
        console.warn('SizeMatrix: onChange is not a function', onChange);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('SizeMatrix onChange handler threw', err);
    }
  };

  const handleSizeChange = (size, value) => {
    try {
      // parseInt can return NaN for empty strings; coerce safely
      const parsed = parseInt(value, 10);
      const safeNum = Number.isFinite(parsed) ? parsed : 0;
      const numValue = Math.max(0, safeNum || 0);
      safeOnChange(prev => ({
        ...prev,
        [size]: numValue
      }));
    } catch (err) {
      // guard against unexpected value types
      // eslint-disable-next-line no-console
      console.error('Error handling size change', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {sizeRange.map((size) => (
          <div key={size} className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t(size)}
            </label>
            <input
              type="number"
              min="0"
              value={sizeMatrix[size] || ''}
              onChange={(e) => handleSizeChange(size, e.target.value)}
              className="size-matrix-input w-full"
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SizeMatrix;