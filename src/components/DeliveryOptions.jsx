import React from 'react';
import { Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const DeliveryOptions = ({ totalQty, withDelivery, onDeliveryChange }) => {
  const { t } = useLanguage();

  const deliveryCost = Math.ceil(totalQty / 50) * 50;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="delivery-switch" className="flex items-center cursor-pointer">
          <Truck className="h-6 w-6 ltr:mr-3 rtl:ml-3 text-gray-600" />
          <span className="text-lg font-medium text-gray-800">{t('addDelivery')}</span>
        </Label>
        <Switch
          id="delivery-switch"
          checked={withDelivery}
          onCheckedChange={onDeliveryChange}
          disabled={totalQty === 0}
        />
      </div>
      <p className="text-sm text-gray-500">{t('deliveryPriceInfo')}</p>
      {withDelivery && totalQty > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-blue-800">{t('calculatedDeliveryCost')}:</span>
            <span className="text-xl font-bold text-blue-600">₪{deliveryCost.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryOptions;