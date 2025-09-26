import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const SizeMatrix = ({ sizeRange, sizeMatrix, onChange }) => {
  const { t } = useLanguage();

  const handleSizeChange = (size, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    onChange(prev => ({
      ...prev,
      [size]: numValue
    }));
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