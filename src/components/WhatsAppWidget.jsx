import React, { useMemo } from 'react';

// Small floating WhatsApp button that opens a chat to the business number.
// Phone can be provided via VITE_WHATSAPP_NUMBER (e.g., 972546969974);
// we'll also accept local formats like 054-696-9974 and normalize.
export default function WhatsAppWidget({
  phone: phoneProp,
  message = 'שלום, יש לי שאלה לגבי הזמנה/מחירון',
  className = '',
}) {
  const rawEnv = (import.meta?.env?.VITE_WHATSAPP_NUMBER || '').toString();
  const phone = phoneProp || rawEnv || '972546969974'; // default: +972 54-696-9974

  const normalized = useMemo(() => {
    try {
      // Strip non-digits
      const digits = String(phone).replace(/\D+/g, '');
      if (!digits) return '';
      // If starts with 0 and length >= 9, convert to 972 prefix (Israel)
      if (digits.startsWith('0')) {
        return '972' + digits.slice(1);
      }
      // Otherwise assume already in international form (without plus)
      return digits;
    } catch {
      return '';
    }
  }, [phone]);

  if (!normalized) return null;

  const href = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="צ׳אט ב-WhatsApp"
      title="דברו איתנו ב-WhatsApp"
      className={`fixed z-50 right-4 bottom-4 sm:right-5 sm:bottom-5 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 ${className}`}
    >
      <span
        className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] text-white"
      >
        {/* WhatsApp logo (SVG) */}
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M19.11 17.18c-.26-.13-1.53-.76-1.77-.84c-.24-.09-.42-.13-.6.13c-.18.26-.69.84-.85 1.01c-.16.18-.31.2-.57.07c-.26-.13-1.08-.4-2.06-1.28c-.76-.68-1.28-1.52-1.43-1.78c-.15-.26-.02-.4.11-.53c.11-.11.26-.29.38-.44c.13-.15.17-.26.26-.44c.09-.18.04-.33-.02-.46c-.06-.13-.6-1.44-.82-1.97c-.22-.53-.44-.46-.6-.46c-.15 0-.33-.02-.51-.02s-.46.07-.7.33c-.24.26-.92.9-.92 2.2c0 1.3.94 2.55 1.07 2.72c.13.18 1.84 2.81 4.46 3.93c.62.27 1.11.43 1.49.55c.63.2 1.2.17 1.65.11c.5-.08 1.53-.63 1.75-1.25c.22-.62.22-1.15.15-1.25c-.06-.1-.24-.16-.5-.29z"/>
          <path fill="currentColor" d="M27.91 4.1C25.11 1.3 21.65 0 18 0C8.07 0 .02 8.05.02 18c0 3.15.83 6.23 2.42 8.94L0 32l5.2-2.38C7.84 31.22 10.88 32 14 32c9.94 0 18-8.06 18-18c0-3.65-1.3-7.11-4.09-9.9zM14 29.09c-2.79 0-5.52-.75-7.89-2.17l-.57-.34l-3.08 1.41l.66-3.01l-.37-.62C1.41 21.8.91 19.91.91 18C.91 9.02 8.02 1.91 17 1.91c4.27 0 8.28 1.66 11.29 4.68c3.02 3.01 4.68 7.03 4.68 11.29c0 8.98-7.11 16.19-16.19 16.19z"/>
        </svg>
      </span>
    </a>
  );
}
