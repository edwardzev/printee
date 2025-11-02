import React from 'react';
import { Helmet } from 'react-helmet';

export default function Contact() {
  // WhatsApp configuration as per requirements
  const whatsappPhone = '9725074497';
  const whatsappMessage = 'שלום, הגעתי מאתר printeam.co.il\nיש לי שאלה -';
  const whatsappLink = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;
  
  // Address for Google Maps
  const address = 'האורגים 32, חולון';
  // Google Maps embed URL for האורגים 32, חולון, Israel
  const googleMapsEmbedUrl = 'https://maps.google.com/maps?width=100%25&height=400&hl=en&q=%D7%94%D7%90%D7%95%D7%A8%D7%92%D7%99%D7%9D%2032%2C%20%D7%97%D7%95%D7%9C%D7%95%D7%9F&t=&z=16&ie=UTF8&iwloc=B&output=embed';

  return (
    <div className="min-h-screen py-12">
      <Helmet>
        <title>צור קשר – Printeam</title>
        <meta name="description" content="צור קשר עם Printeam - השאר הודעה בוואטסאפ, שלח אימייל או בקר במשרדינו ברחוב האורגים 32, חולון" />
        <link rel="canonical" href="https://printeam.co.il/contact" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            mainEntity: {
              "@type": "Organization",
              name: "Printeam",
              address: {
                "@type": "PostalAddress",
                streetAddress: "האורגים 32",
                addressLocality: "חולון",
                addressCountry: "IL"
              },
              email: "info@printmarket.co.il",
              telephone: "+9725074497"
            }
          })}
        </script>
      </Helmet>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">צור קשר</h1>
        
        {/* WhatsApp Section - Centered with Big Logo */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 text-center">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-4 group"
          >
            {/* Large WhatsApp Logo */}
            <div className="w-32 h-32 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" width={80} height={80} fill="none" aria-hidden="true">
                <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.373 0 .02 5.373.02 12c0 2.116.557 4.184 1.616 6.03L0 24l6.197-1.586A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12 0-1.9-.42-3.7-1.48-5.24z" fill="currentColor" opacity="0.08" />
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.149-.199.297-.768.966-.941 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.885-.788-1.48-1.761-1.654-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.199-.298.298-.497.099-.199.05-.372-.025-.521-.074-.149-.672-1.612-.922-2.206-.243-.579-.49-.5-.672-.51-.172-.007-.371-.009-.57-.009-.199 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462.963 2.877 1.098 3.079.134.199 1.895 2.963 4.6 4.154 1.62.7 2.466.934 3.33 1.005.627.05 1.22.043 1.683.026.514-.018 1.758-.717 2.007-1.41.25-.693.25-1.287.175-1.41-.074-.124-.272-.199-.57-.348z" fill="white" />
              </svg>
            </div>
            
            {/* Text */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[#25D366] transition-colors">
                דברו איתנו
              </h2>
              <p className="text-gray-600 mt-2">
                לחצו כאן לפתיחת שיחה בוואטסאפ
              </p>
            </div>
          </a>
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">אימייל</h3>
          <a 
            href="mailto:info@printmarket.co.il"
            className="text-blue-600 hover:text-blue-700 text-lg font-medium transition-colors"
          >
            info@printmarket.co.il
          </a>
        </div>

        {/* Address Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">כתובת</h3>
          <p className="text-gray-700 text-lg">
            {address}
          </p>
        </div>

        {/* Google Maps Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">מיקום</h3>
          <div className="w-full h-[400px] rounded-lg overflow-hidden">
            <iframe
              src={googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps - האורגים 32, חולון"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
