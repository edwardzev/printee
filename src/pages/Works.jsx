import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Works = () => {
  const [heroImages, setHeroImages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Attempt to fetch the generated manifest. If it doesn't exist, fall back to trying a few common names.
    const fetchManifest = async () => {
      try {
        const res = await fetch('/hero_images/works_page/manifest.json');
        if (!res.ok) throw new Error('Manifest not found');
        const list = await res.json();
        setHeroImages(list);
        console.log('Loaded works manifest with', list.length, 'entries');
      } catch (e) {
        console.warn('Could not load manifest:', e.message);
        // Fallback: try a small, conservative scan of predictable filenames (if any)
        // but prefer manifest approach. Leave the list empty so dev can generate manifest.
        setHeroImages([]);
        setError('No manifest available. Run the generate script or build to create one.');
      }
    };
    fetchManifest();
  }, []);

  return (
    <div className="works-page px-4 py-8">
      <h1 className="text-center text-3xl font-bold mb-8">Our Works</h1>
      {error && (
        <div className="mb-6 text-sm text-red-600">{error}</div>
      )}
      <div>
        {heroImages.length === 0 && !error && (
          <div className="text-center text-gray-500">Loading hero images...</div>
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