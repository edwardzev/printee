import React, { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const DeliveryOptions = ({ totalQty, withDelivery, onDeliveryChange, contact = {}, onContactChange }) => {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState(withDelivery ? 'delivery' : 'pickup');
  const [local, setLocal] = useState({
    fullName: contact.fullName || '',
    phone: contact.phone || '',
    street: contact.street || '',
    city: contact.city || ''
  });

  useEffect(() => {
    setMode(withDelivery ? 'delivery' : 'pickup');
  }, [withDelivery]);

  useEffect(() => {
    setLocal({
      fullName: contact.fullName || '',
      phone: contact.phone || '',
      street: contact.street || '',
      city: contact.city || ''
    });
  }, [contact]);

  const deliveryCost = Math.ceil(totalQty / 50) * 50;

  const handleModeChange = (m) => {
    setMode(m);
    const isDelivery = m === 'delivery';
    if (typeof onDeliveryChange === 'function') onDeliveryChange(isDelivery);
  };

  const handleFieldBlur = () => {
    if (typeof onContactChange === 'function') onContactChange({ ...local });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('deliveryOptions')}</h3>
        <div className="flex rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => handleModeChange('delivery')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${mode === 'delivery' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
          >
            {language === 'he' ? 'משלוח' : t('addDelivery')}
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('pickup')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${mode === 'pickup' ? 'bg-white text-gray-700' : 'text-gray-700'}`}
          >
            {language === 'he' ? 'איסוף עצמי' : 'Pickup'}
          </button>
        </div>
      </div>

      {/* Show pickup address when pickup selected; otherwise render delivery form */}
      {mode === 'pickup' ? (
        <div className="text-sm text-gray-700 mb-3">{t('pickupAddress')}</div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'he' ? 'שם מלא' : 'Full name'}</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={local.fullName}
                onChange={(e) => setLocal(s => ({ ...s, fullName: e.target.value }))}
                onBlur={handleFieldBlur}
                placeholder={language === 'he' ? 'שם מלא' : 'Full name'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'he' ? 'טלפון' : 'Phone'}</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={local.phone}
                onChange={(e) => setLocal(s => ({ ...s, phone: e.target.value }))}
                onBlur={handleFieldBlur}
                placeholder={language === 'he' ? '05x-xxxxxxx' : '05x-xxxxxxx'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'he' ? 'רחוב ומס בית' : 'Street & house number'}</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={local.street}
              onChange={(e) => setLocal(s => ({ ...s, street: e.target.value }))}
              onBlur={handleFieldBlur}
              placeholder={language === 'he' ? 'שם הרחוב ומס בית' : 'Street and house number'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'he' ? 'עיר' : 'City'}</label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={local.city}
              onChange={(e) => setLocal(s => ({ ...s, city: e.target.value }))}
              onBlur={handleFieldBlur}
              placeholder={language === 'he' ? 'עיר' : 'City'}
            />
          </div>

          <p className="text-sm text-gray-500 mt-2">{t('deliveryPriceInfo')}</p>
        </div>
      )}
    </div>
  );
};

export default DeliveryOptions;