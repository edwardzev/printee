import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';

const DiscountPopup = ({ open, onOpenChange, savingsAmount = '' }) => {
  const { t } = useLanguage();
  const { mergePayload, payload, cartItems } = useCart();
  
  const [name, setName] = useState(payload?.contact?.name || '');
  const [phone, setPhone] = useState(payload?.contact?.phone || '');
  const [email, setEmail] = useState(payload?.contact?.email || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save contact information to cart payload
    try {
      mergePayload({
        contact: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim()
        },
        discountClaimed: true
      });
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('printee:discount-claimed', 'true');
        }
      } catch (storageError) {
        // ignore storage failures
      }
    } catch (error) {
      console.error('Failed to save contact info:', error);
    }
    
    // Send Airtable webhook with customer details at the point of accepting discount
    try {
      // Ensure we have an idempotency key
      let idem = payload?.idempotency_key;
      if (!idem) {
        idem = `ord-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        try { mergePayload({ idempotency_key: idem }); } catch {}
      }
      
      // Build uploads list from cart items
      const uploads = (() => {
        try {
          const list = [];
          (cartItems || []).forEach((item) => {
            const product = item.productSku || item.product || 'product';
            const matrices = item.sizeMatrices || {};
            // Determine active colors and their total qty
            let colors = item.selectedColors && Array.isArray(item.selectedColors) && item.selectedColors.length
              ? item.selectedColors
              : (item.color ? [item.color] : []);
            if (colors.length === 0) return;

            // Reduce to active colors with qty > 0
            const activeColors = [];
            let totalQtyForItem = 0;
            colors.forEach((c) => {
              const mat = (matrices && matrices[c]) || (c === item.color ? (item.sizeMatrix || {}) : {});
              const qty = Object.values(mat || {}).reduce((s, q) => s + (q || 0), 0);
              if (qty > 0) {
                activeColors.push(c);
                totalQtyForItem += qty;
              }
            });
            if (activeColors.length === 0) return;

            // Map areaKey -> method
            const areaMethod = {};
            (item.selectedPrintAreas || []).forEach((sel) => {
              if (!sel) return;
              if (typeof sel === 'string') areaMethod[sel] = 'print';
              else if (sel.areaKey) areaMethod[sel.areaKey] = sel.method || 'print';
            });

            const designs = item.uploadedDesigns || {};
            Object.keys(designs).forEach((areaKey) => {
              const d = designs[areaKey];
              if (!d || !d.url) return;
              const method = areaMethod[areaKey] || 'print';
              const fileName = d.name || `${areaKey}.png`;
              // Prefer originalUrl (PDF) if present; fallback to preview url
              const dataUrl = (d.originalUrl && typeof d.originalUrl === 'string') ? d.originalUrl : d.url;
              list.push({
                areaKey,
                method,
                product,
                colors: activeColors,
                qty: totalQtyForItem,
                dataUrl,
                fileName,
              });
            });
          });
          return list;
        } catch (e) {
          return [];
        }
      })();
      
      // Send webhook to Airtable with customer details
      const body = JSON.stringify({
        idempotency_key: idem,
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim()
        },
        uploads
      });
      
      // Fire-and-forget webhook
      fetch('/api/airtable/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch(() => {});
    } catch (error) {
      console.error('Failed to send Airtable webhook:', error);
    }
    
    onOpenChange(false);
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl text-center mb-2">
              {t('discountTitle')}
            </DialogTitle>
            <DialogDescription className="text-center text-lg py-2">
              {t('discountMessage')}
            </DialogDescription>
            <DialogDescription className="text-center text-sm py-2">
              {typeof t('discountFormMessage') === 'function'
                ? t('discountFormMessage')(savingsAmount)
                : t('discountFormMessage')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('nameLabel')}
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('phoneLabel')}
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailLabel')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                type="submit"
                className="flex-1"
                size="lg"
              >
                {t('discountButton')}
              </Button>
              <Button 
                type="button"
                onClick={handleSkip}
                variant="outline"
                size="lg"
              >
                {t('discountSkip')}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountPopup;
