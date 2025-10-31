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

const DiscountPopup = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const { mergePayload, payload } = useCart();
  
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
        }
      });
    } catch (error) {
      console.error('Failed to save contact info:', error);
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
              {t('discountFormMessage')}
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
