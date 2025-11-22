import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { printAreas } from '@/data/products';

const PrintAreaSelector = ({ availableAreas, selectedAreas, onChange }) => {
  const { t, language } = useLanguage();

  // Normalize selectedAreas into array of objects { areaKey, method }
  const normalize = (s) => {
    if (!Array.isArray(s)) return [];
    if (s.length === 0) return [];
    if (typeof s[0] === 'string') return s.map(k => ({ areaKey: k, method: 'print' }));
    return s;
  };
  const selected = normalize(selectedAreas);

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
    const isSelected = selected.some(s => s.areaKey === areaKey);
    const group = groupByArea[areaKey];

    if (isSelected) {
      onChange(selected.filter(a => a.areaKey !== areaKey));
      return;
    }

    // Start from current selections
    let next = [...selected];

    // If areaKey belongs to an exclusive group (front pair or back pair), remove others in that group
    if (group) {
      next = next.filter(a => !group.includes(a.areaKey));
    }

    // Remove incompatible picks between front and chest (both directions),
    // but do NOT remove the other chest (left/right) — they can coexist.
    next = next.filter(a => !conflictsWith(areaKey, a.areaKey));

    // Add the newly selected area with default method 'print'
    next.push({ areaKey, method: 'print' });

    onChange(next);
  };

  const onCardClick = (areaKey, disabledByGroup, disabledByConflict) => {
    // If disabled only because another option in the *same exclusive group* is selected,
    // clicking should SWITCH to this one (replace the group's selection).
    if (disabledByGroup) {
      const group = groupByArea[areaKey] || [];
      const next = selected.filter(a => !group.includes(a.areaKey));
      onChange([...next, { areaKey, method: 'print' }]);
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
        const selObj = selected.find(s => s.areaKey === areaKey);
        const isSelected = !!selObj;

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
            className={`print-area-card p-4 border-2 rounded-lg transition-all overflow-hidden h-full ${
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
                  src={`/areas/${areaKey}.jpg`}
                  alt={(language === 'he' ? area.labelHe : area.label) + ' preview'}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith('.jpg')) {
                      e.currentTarget.src = e.currentTarget.src.replace('.jpg', '.jpeg');
                    } else if (e.currentTarget.src.endsWith('.jpeg')) {
                      e.currentTarget.src = e.currentTarget.src.replace('.jpeg', '.png');
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
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex flex-col items-stretch gap-2 w-full">
                  <label className="w-full flex flex-col sm:flex-row justify-between items-center text-sm">
                    <div className={`flex items-center gap-2 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
                      {language === 'he' ? (
                        <>
                          <span className="text-sm">{language === 'he' ? 'הדפסה' : 'Print'}</span>
                          <input
                            type="radio"
                            name={`method-${areaKey}`}
                            checked={!!selObj && selObj.method === 'print'}
                            onChange={() => {
                              // selecting print should also ensure the area is selected
                              if (!isSelected) {
                                // select respecting exclusivity
                                toggleArea(areaKey, disabled);
                                return;
                              }
                              const next = selected.map(s => s.areaKey === areaKey ? { ...s, method: 'print' } : s);
                              onChange(next);
                            }}
                            disabled={disabled}
                            className="flex-shrink-0"
                          />
                        </>
                      ) : (
                        <>
                          <input
                            type="radio"
                            name={`method-${areaKey}`}
                            checked={!!selObj && selObj.method === 'print'}
                            onChange={() => {
                              // selecting print should also ensure the area is selected
                              if (!isSelected) {
                                // select respecting exclusivity
                                toggleArea(areaKey, disabled);
                                return;
                              }
                              const next = selected.map(s => s.areaKey === areaKey ? { ...s, method: 'print' } : s);
                              onChange(next);
                            }}
                            disabled={disabled}
                            className="flex-shrink-0"
                          />
                          <span className="text-sm">{language === 'he' ? 'הדפסה' : 'Print'}</span>
                        </>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 sm:truncate max-w-[7rem] text-right mt-2 sm:mt-0">{language === 'he' ? `₪${area.fee} ליח׳` : `₪${area.fee}/unit`}</span>
                  </label>

                  {area.emboAllowed && (
                    <label className="w-full flex flex-col sm:flex-row justify-between items-center text-sm">
                      <div className={`flex items-center gap-2 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
                        {language === 'he' ? (
                          <>
                            <span className="text-sm">{language === 'he' ? 'רקמה' : 'Embo'}</span>
                            <input
                              type="radio"
                              name={`method-${areaKey}`}
                              checked={!!selObj && selObj.method === 'embo'}
                              onChange={() => {
                                if (!isSelected) {
                                  // select with embo method while respecting exclusivity: create next manually
                                  const group = groupByArea[areaKey] || [];
                                  let next = selected.filter(a => !group.includes(a.areaKey));
                                  next = next.filter(a => !conflictsWith(areaKey, a.areaKey));
                                  next.push({ areaKey, method: 'embo' });
                                  onChange(next);
                                  return;
                                }
                                const next = selected.map(s => s.areaKey === areaKey ? { ...s, method: 'embo' } : s);
                                onChange(next);
                              }}
                              disabled={disabled}
                              className="flex-shrink-0"
                            />
                          </>
                        ) : (
                          <>
                            <input
                              type="radio"
                              name={`method-${areaKey}`}
                              checked={!!selObj && selObj.method === 'embo'}
                              onChange={() => {
                                if (!isSelected) {
                                  // select with embo method while respecting exclusivity: create next manually
                                  const group = groupByArea[areaKey] || [];
                                  let next = selected.filter(a => !group.includes(a.areaKey));
                                  next = next.filter(a => !conflictsWith(areaKey, a.areaKey));
                                  next.push({ areaKey, method: 'embo' });
                                  onChange(next);
                                  return;
                                }
                                const next = selected.map(s => s.areaKey === areaKey ? { ...s, method: 'embo' } : s);
                                onChange(next);
                              }}
                              disabled={disabled}
                              className="flex-shrink-0"
                            />
                            <span className="text-sm">{language === 'he' ? 'רקמה' : 'Embo'}</span>
                          </>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 sm:truncate max-w-[7rem] text-right mt-2 sm:mt-0">{language === 'he' ? '₪10 ליח׳' : '₪10/unit'}</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PrintAreaSelector;