import React, { useMemo } from 'react';

// WhatsAppWidget supports two modes:
// - floating (default): fixed bottom-right circular button
// - inline/compact: small inline button suitable for header placement
export default function WhatsAppWidget({
  phone: phoneProp,
  message = 'שלום, יש לי שאלה לגבי הזמנה/מחירון',
  className = '',
  inline = false,
  size = 40,
}) {
  const rawEnv = (import.meta?.env?.VITE_WHATSAPP_NUMBER || '').toString();
  const phone = phoneProp || rawEnv || '972555074497'; // default

  const normalized = useMemo(() => {
    try {
      const digits = String(phone).replace(/\D+/g, '');
      if (!digits) return '';
      if (digits.startsWith('0')) return '972' + digits.slice(1);
      return digits;
    } catch {
      return '';
    }
  }, [phone]);

  if (!normalized) return null;

  const href = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;

  if (inline) {
    // Compact inline variant for header
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp chat"
        title="WhatsApp"
        data-clarity-element="whatsapp-button"
        className={`inline-flex items-center justify-center rounded-full bg-[#25D366] text-white hover:brightness-95 transition ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" aria-hidden>
          <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.373 0 .02 5.373.02 12c0 2.116.557 4.184 1.616 6.03L0 24l6.197-1.586A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-1.9-.42-3.7-1.48-5.24z" fill="currentColor" opacity="0.08" />
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.149-.199.297-.768.966-.941 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.885-.788-1.48-1.761-1.654-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.199-.298.298-.497.099-.199.05-.372-.025-.521-.074-.149-.672-1.612-.922-2.206-.243-.579-.49-.5-.672-.51-.172-.007-.371-.009-.57-.009-.199 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462.963 2.877 1.098 3.079.134.199 1.895 2.963 4.6 4.154 1.62.7 2.466.934 3.33 1.005.627.05 1.22.043 1.683.026.514-.018 1.758-.717 2.007-1.41.25-.693.25-1.287.175-1.41-.074-.124-.272-.199-.57-.348z" fill="currentColor" />
        </svg>
      </a>
    );
  }

  // Floating default
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="צ׳אט ב-WhatsApp"
      title="דברו איתנו ב-WhatsApp"
      data-clarity-element="whatsapp-button"
      className={`fixed z-50 right-4 bottom-4 sm:right-5 sm:bottom-5 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 ${className}`}
      style={{ width: 56, height: 56 }}
    >
      <span className="flex items-center justify-center w-full h-full rounded-full bg-[#25D366] text-white">
        <svg viewBox="0 0 24 24" width={28} height={28} fill="none" aria-hidden>
          <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.373 0 .02 5.373.02 12c0 2.116.557 4.184 1.616 6.03L0 24l6.197-1.586A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-1.9-.42-3.7-1.48-5.24z" fill="currentColor" opacity="0.08" />
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.149-.199.297-.768.966-.941 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.885-.788-1.48-1.761-1.654-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.199-.298.298-.497.099-.199.05-.372-.025-.521-.074-.149-.672-1.612-.922-2.206-.243-.579-.49-.5-.672-.51-.172-.007-.371-.009-.57-.009-.199 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462.963 2.877 1.098 3.079.134.199 1.895 2.963 4.6 4.154 1.62.7 2.466.934 3.33 1.005.627.05 1.22.043 1.683.026.514-.018 1.758-.717 2.007-1.41.25-.693.25-1.287.175-1.41-.074-.124-.272-.199-.57-.348z" fill="currentColor" />
        </svg>
      </span>
    </a>
  );
}
