import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ThankYouIcount() {
  const nav = useNavigate();
  useEffect(() => {
    // after seeing this page we redirect to the normal thank you
    const t = setTimeout(() => { nav('/thank-you'); }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">תודה! התשלום אושר</h1>
        <p className="text-gray-600">אנא המתן בעוד אנו מסיימים לעבד את ההזמנה. תועבר לעמוד האישור תוך שניות.</p>
      </div>
    </div>
  );
}
