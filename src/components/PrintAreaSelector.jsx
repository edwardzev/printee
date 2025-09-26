import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { printAreas } from '@/data/products';

const PrintAreaSelector = ({ availableAreas, selectedAreas, onChange }) => {
  const { t, language } = useLanguage();

  // Exclusivity: pick ONE of frontA4/frontA3 and ONE of backA4/backA3.
  const exclusiveGroups = [
    ['frontA4', 'frontA3'],
    ['backA4', 'backA3'],
  ];
  const groupByArea = exclusiveGroups.reduce((acc, group) => {
    group.forEach(k => { acc[k] = group; });
    return acc;
  }, {});

  const isFront = (k) => k === 'frontA4' || k === 'frontA3';
  const isChest = (k) => k === 'leftChest' || k === 'rightChest';
  const conflictsWith = (k1, k2) =>
    (isFront(k1) && isChest(k2)) || (isChest(k1) && isFront(k2));

  const toggleArea = (areaKey, disabled) => {
    if (disabled) return;
    const isSelected = selectedAreas.includes(areaKey);
    const group = groupByArea[areaKey];

    if (isSelected) {
      onChange(selectedAreas.filter(a => a !== areaKey));
      return;
    }

    // Start from current selections
    let next = [...selectedAreas];

    // If areaKey belongs to an exclusive group (front pair or back pair), remove others in that group
    if (group) {
      next = next.filter(a => !group.includes(a));
    }

    // Remove incompatible picks between front and chest (both directions),
    // but do NOT remove the other chest (left/right) — they can coexist.
    next = next.filter(a => !conflictsWith(areaKey, a));

    // Add the newly selected area
    next.push(areaKey);

    onChange(next);
  };

  const onCardClick = (areaKey, disabledByGroup, disabledByConflict) => {
    // If disabled only because another option in the *same exclusive group* is selected,
    // clicking should SWITCH to this one (replace the group's selection).
    if (disabledByGroup) {
      const group = groupByArea[areaKey] || [];
      const next = selectedAreas.filter(a => !group.includes(a));
      onChange([...next, areaKey]);
      return;
    }
    // If disabled due to a *front↔chest* conflict, keep disabled (no switch).
    if (disabledByConflict) {
      return;
    }
    // Otherwise, normal toggle
    toggleArea(areaKey, false);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {availableAreas.map((areaKey) => {
        const area = printAreas[areaKey];
        const isSelected = selectedAreas.includes(areaKey);

        const group = groupByArea[areaKey];
        const disabledByGroup = !!group && selectedAreas.some(a => group.includes(a) && a !== areaKey);
        const disabledByConflict =
          (isChest(areaKey) && selectedAreas.some(a => isFront(a))) ||
          (isFront(areaKey) && selectedAreas.some(a => isChest(a)));

        const disabled = disabledByGroup || disabledByConflict;
        
        return (
          <motion.div
            key={areaKey}
            whileHover={disabledByConflict ? undefined : { scale: 1.02 }}
            whileTap={disabledByConflict ? undefined : { scale: 0.98 }}
            onClick={() => onCardClick(areaKey, disabledByGroup, disabledByConflict)}
            onKeyDown={(e) => {
              if (disabledByConflict) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCardClick(areaKey, disabledByGroup, disabledByConflict);
              }
            }}
            role="button"
            tabIndex={disabledByConflict ? -1 : 0}
            aria-disabled={disabledByConflict}
            className={`print-area-card p-4 border-2 rounded-lg transition-all ${
              disabledByConflict
                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                : isSelected
                  ? 'cursor-pointer pointer-events-auto border-blue-500 bg-blue-50'
                  : disabledByGroup
                    ? 'cursor-pointer pointer-events-auto border-gray-200 bg-gray-50 opacity-60 hover:border-gray-300'
                    : 'cursor-pointer pointer-events-auto border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              {/* area preview image */}
              <div className="w-full mx-auto mb-3 rounded-md overflow-hidden bg-gray-50 aspect-square">
                <img
                  src={`/areas/${areaKey}.jpeg`}
                  alt={(language === 'he' ? area.labelHe : area.label) + ' preview'}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith('.jpeg')) {
                      e.currentTarget.src = e.currentTarget.src.replace('.jpeg', '.jpg');
                    } else if (e.currentTarget.src.endsWith('.jpg')) {
                      e.currentTarget.src = e.currentTarget.src.replace('.jpg', '.png');
                    } else if (e.currentTarget.src.endsWith('.png')) {
                      e.currentTarget.src = e.currentTarget.src.replace('.png', '.webp');
                    }
                  }}
                />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                {language === 'he' ? area.labelHe : area.label}
              </h3>
              {disabledByConflict && (
                <p className="text-[11px] text-gray-500 mb-1">
                  {language === 'he' ? 'לא ניתן לבחור יחד עם אפשרות זו' : 'Not compatible with the selected option'}
                </p>
              )}
              <p className="text-xs text-gray-500 mb-2">
                {language === 'he' ? 'מקסימום' : 'Max'}: {area.maxWCm}cm×{area.maxHCm}cm
              </p>
              <p className="text-sm font-semibold text-blue-600">
                ₪{area.fee}{language === 'he' ? ' ליחידה' : '/unit'}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PrintAreaSelector;