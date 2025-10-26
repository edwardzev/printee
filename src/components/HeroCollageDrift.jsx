import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

// 1) Your real images: hero_2.webp .. hero_34.webp
const ALL_IMAGES = Array.from({ length: 33 }, (_, i) => `/hero_images/hero_${i + 2}.webp`);

function pickUnique(count, maxExclusive) {
  const n = Math.min(count, Math.max(0, maxExclusive));
  const out = new Set();
  if (n <= 0) return [];
  if (n >= maxExclusive) return Array.from({ length: maxExclusive }, (_, i) => i);
  while (out.size < n) out.add(Math.floor(Math.random() * maxExclusive));
  return Array.from(out);
}

export default function HeroCollageDrift() {
  const TILES = 4; // 2x2

  const [visibleIdxs, setVisibleIdxs] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  // Parallax
  const containerRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-3, 3]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia && window.matchMedia('(max-width: 768px)');
    const mobile = !!(mq && mq.matches);
    setIsMobile(mobile);
    const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(!!(rm && rm.matches));

    // choose 2 tiles on mobile, otherwise TILES
    const initialTiles = mobile ? 2 : TILES;
    setVisibleIdxs(pickUnique(initialTiles, ALL_IMAGES.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // avoid replacing same tile twice in a row
  const lastReplacedRef = useRef(-1);

  function replaceAtPosition(pos) {
    setVisibleIdxs((cur) => {
      if (!Array.isArray(cur) || cur.length === 0) return cur;
      const used = new Set(cur);
      const available = ALL_IMAGES.map((_, i) => i).filter((i) => !used.has(i));
      const next = [...cur];
      let chosen = null;
      if (available.length > 0) chosen = available[Math.floor(Math.random() * available.length)];
      else chosen = Math.floor(Math.random() * ALL_IMAGES.length);
      next[pos] = chosen;
      lastReplacedRef.current = pos;
      return next;
    });
  }

  // periodic replacement of a single tile
  useEffect(() => {
  // allow replacements on mobile too, but slower
  if (prefersReduced) return undefined;
  if (!visibleIdxs || visibleIdxs.length === 0) return undefined;

  const intervalMs = isMobile ? 2200 : 1400;
    const handle = setInterval(() => {
      setVisibleIdxs((current) => {
        if (!Array.isArray(current) || current.length === 0) return current;
  const next = [...current];
        // pick a position different from lastReplacedRef
        let pos = Math.floor(Math.random() * next.length);
        let attempts = 0;
        while (pos === lastReplacedRef.current && attempts < 6) {
          pos = Math.floor(Math.random() * next.length);
          attempts += 1;
        }

        const used = new Set(next);
        const available = ALL_IMAGES.map((_, i) => i).filter((i) => !used.has(i));
        let chosen = null;
        if (available.length > 0) chosen = available[Math.floor(Math.random() * available.length)];
        else chosen = Math.floor(Math.random() * ALL_IMAGES.length);
        next[pos] = chosen;
        lastReplacedRef.current = pos;
        return next;
      });
    }, intervalMs);

    return () => clearInterval(handle);
  }, [visibleIdxs, isMobile, prefersReduced]);

  function handleMouseMove(e) {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    mx.set(px - 0.5);
    my.set(py - 0.5);
  }

  // replace broken image at tile position
  function handleBroken(pos, src) {
    // console log helps pinpoint failing URLs in the browser console
    try {
      // eslint-disable-next-line no-console
      console.warn(`[HeroCollageDrift] image failed to load: ${src}, replacing tile ${pos}`);
    } catch (e) {}
    replaceAtPosition(pos);
  }

  return (
    <section className="relative w-full min-h-[60vh] overflow-hidden">
      <motion.div ref={containerRef} onMouseMove={handleMouseMove} style={{ rotateX, rotateY }} className="relative mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-2" style={{ perspective: 1000 }}>
          {visibleIdxs.length > 0 ? (
            visibleIdxs.map((i, idx) => (
              <motion.div key={`tile-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 * idx }}>
                <Tile src={ALL_IMAGES[i]} eager={idx < 4} prefersReduced={prefersReduced} onBroken={(s) => handleBroken(idx, s)} />
              </motion.div>
            ))
          ) : (
            Array.from({ length: TILES }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
            ))
          )}
        </div>
      </motion.div>
    </section>
  );
}

function Tile({ src, eager = false, prefersReduced = false, onBroken = null }) {
  const floatDuration = 6 + Math.random() * 3;

  const imgTransition = prefersReduced ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' };
  const animProps = prefersReduced
    ? { animate: { y: 0, scale: 1 }, transition: { duration: 0 } }
    : { animate: { y: [0, -6, 0], scale: [1, 1.02, 1] }, transition: { duration: floatDuration, repeat: Infinity, ease: 'easeInOut' } };

  return (
    <motion.div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm bg-white/0 ring-0" {...animProps} whileHover={{ scale: prefersReduced ? 1 : 1.02 }} style={{ willChange: 'transform, opacity' }}>
      <AnimatePresence mode="wait">
        <motion.img
          key={src}
          src={src}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'low'}
          className="h-full w-full object-cover select-none rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={imgTransition}
          draggable={false}
          onError={(e) => {
            try {
              const srcUrl = e?.target?.src || src;
              if (typeof onBroken === 'function') onBroken(srcUrl);
            } catch (err) {}
          }}
        />
      </AnimatePresence>
    </motion.div>
  );
}

