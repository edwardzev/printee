import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { printAreas } from '@/data/products';

const PrintAreaSelector = ({ availableAreas, selectedAreas, onChange }) => {
  const { t, language } = useLanguage();

  const toggleArea = (areaKey) => {
    if (selectedAreas.includes(areaKey)) {
      onChange(selectedAreas.filter(area => area !== areaKey));
    } else {
      onChange([...selectedAreas, areaKey]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {availableAreas.map((areaKey) => {
        const area = printAreas[areaKey];
        const isSelected = selectedAreas.includes(areaKey);
        
        return (
          <motion.div
            key={areaKey}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleArea(areaKey)}
            className={`print-area-card p-4 border-2 rounded-lg cursor-pointer transition-all ${
              isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="text-sm font-bold">
                  {area.maxWCm}×{area.maxHCm}
                </span>
              </div>
              
              <h3 className="font-medium text-gray-900 mb-1">
                {language === 'he' ? area.labelHe : area.label}
              </h3>
              
              <p className="text-xs text-gray-500 mb-2">
                Max: {area.maxWCm}×{area.maxHCm}cm
              </p>
              
              <p className="text-sm font-semibold text-blue-600">
                +₪{area.fee}/unit
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PrintAreaSelector;