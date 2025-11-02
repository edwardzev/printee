import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const FALLBACK_IMAGES = Array.from({ length: 36 }, (_, i) => `/hero_images/hero_${i + 2}.webp`);

const Works = () => {
  const { language } = useLanguage();
  const [heroImages, setHeroImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchManifest = async () => {
      try {
        const res = await fetch('/hero_images/works_page/manifest.json', { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Unexpected status ${res.status}`);
        const list = await res.json();
        if (!isMounted) return;
        setHeroImages(Array.isArray(list) ? list.filter(Boolean) : []);
        setUsingFallback(false);
      } catch (e) {
        if (!isMounted) return;
        console.warn('[Works] Falling back to default gallery list:', e?.message || e);
        setHeroImages(FALLBACK_IMAGES);
        setUsingFallback(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchManifest();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="works-page px-4 py-8">
      <h1 className="text-center text-3xl font-bold mb-8">
        {language === 'he' ? 'העבודות שלנו' : 'Our Works'}
      </h1>
      {usingFallback && (
        <div className="mb-6 text-sm text-amber-600">
          {language === 'he'
            ? 'לא הצלחנו לטעון את גלריית העבודות המלאה, אז הצגנו מבחר מצומצם של הדפסות לדוגמה.'
            : "We could not load the full gallery right now, so you're seeing a curated sample of recent prints."}
        </div>
      )}
      <div>
        {isLoading && (
          <div className="text-center text-gray-500">
            {language === 'he' ? 'טוענים עבודות לדוגמה…' : 'Loading featured works…'}
          </div>
        )}

        {/* Masonry using CSS columns. Images flow naturally into columns; use break-inside to avoid splitting items. */}
        <div
          className="works-masonry columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 [&_img]:w-full [&_img]:h-auto"
          style={{ columnGap: '1rem' }}
        >
          {heroImages.map((path, index) => (
            <motion.div
              key={path}
              className="mb-4 overflow-hidden rounded-lg shadow-md bg-white"
              style={{ breakInside: 'avoid', WebkitColumnBreakInside: 'avoid' }}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: index * 0.03, ease: 'easeOut' }}
            >
              <img src={path} alt={`Hero ${index + 1}`} loading="lazy" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Works;