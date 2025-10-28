import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * HeroImage (Showcase Carousel)
 * - Full image, no overlays/captions/gradient.
 * - Discovers /public/hero_images/hero-1..hero-30.(webp|jpg|png|jpeg)
 * - Preloads available images, shuffles once, auto-plays with cross-fade.
 * - Arrows + dots + pause-on-hover, RTL-friendly.
 */
export default function HeroImage({
  intervalMs = 4500,
  transitionMs = 600,
  dir = "rtl",
  bg = "#f6f7f9",
  primaryIndex = 1,
}) {
  const [images, setImages] = useState([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const playingRef = useRef(true);

  // Build candidate list: support hero-1..hero-50 and hero_1..hero_50 with modern-first extensions
  const candidates = useMemo(() => {
    // prefer modern formats if present
    const exts = ["avif","webp", "jpg", "png", "jpeg"];
    const out = [];
    // try up to 50 files to cover your set
    for (let i = 1; i <= 50; i++) {
      for (const ext of exts) {
        out.push(`/hero_images/hero-${i}.${ext}`);
        out.push(`/hero_images/hero_${i}.${ext}`);
      }
    }
    return out;
  }, []);

  // Shuffle helper
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Try loading one URL; resolve with url on success, null on fail
  const tryLoad = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  // Preload all candidates and keep successful ones
  useEffect(() => {
    let cancelled = false;

    // Helper: for an index, attempt candidates and return first available or null
    const findFirstForIndex = async (i) => {
      const baseCandidates = [];
      const exts = ['webp','jpg','png','jpeg'];
      for (const ext of exts) {
        baseCandidates.push(`/hero_images/hero_${i}_sm.${ext}`);
        baseCandidates.push(`/hero_images/hero_${i}_lg.${ext}`);
        baseCandidates.push(`/hero_images/hero_${i}.${ext}`);
        baseCandidates.push(`/hero_images/hero-${i}.${ext}`);
      }
      for (const c of baseCandidates) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await tryLoad(c);
        if (ok) return ok;
        if (cancelled) return null;
      }
      return null;
    };

    (async () => {
      // 1) Try to find a primary image (configurable index) quickly in parallel and show it asap
      let primary = null;
      try {
        const primaryCandidates = [];
        const exts = ['avif','webp','jpg','png','jpeg'];
        for (const ext of exts) {
          primaryCandidates.push(`/hero_images/hero_${primaryIndex}_sm.${ext}`);
          primaryCandidates.push(`/hero_images/hero_${primaryIndex}_lg.${ext}`);
          primaryCandidates.push(`/hero_images/hero_${primaryIndex}.${ext}`);
          primaryCandidates.push(`/hero_images/hero-${primaryIndex}.${ext}`);
        }
        // try all primary candidates in parallel and pick first success
        const primaryPromises = primaryCandidates.map((c) => tryLoad(c));
        const primaryResults = await Promise.all(primaryPromises);
        primary = primaryResults.find(Boolean) || null;
      } catch (e) { primary = null; }

      if (cancelled) return;
      if (primary) setImages([primary]);

      // 2) Preload the rest concurrently with a modest concurrency limit
  const maxIndex = 37;
      const concurrency = 6;
      const results = [];
  let current = 1;

      const worker = async () => {
        while (!cancelled) {
          const i = current++;
          if (i > maxIndex) break;
          try {
            const found = await findFirstForIndex(i);
            if (found) results.push(found);
          } catch (_) { /* ignore individual errors */ }
        }
      };

      // start workers
      const workers = new Array(concurrency).fill(null).map(() => worker());
      await Promise.all(workers);
      if (cancelled) return;

      // If we had a primary, ensure it's first and avoid duplicates
      const uniq = Array.from(new Set(results.filter(Boolean)));
      const final = primary ? [primary, ...uniq.filter((u) => u !== primary)] : uniq;
      setImages(shuffle(final));
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [candidates, primaryIndex]);

  // Autoplay
  useEffect(() => {
    if (images.length < 2) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (playingRef.current) {
        setIdx((i) => (i + 1) % images.length);
      }
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images, intervalMs]);

  // Controls
  const go = (delta) => {
    if (!images.length) return;
    setIdx((i) => (i + delta + images.length) % images.length);
  };
  const pause = () => (playingRef.current = false);
  const resume = () => (playingRef.current = true);

  return (
    <section dir={dir} className="hero-wrap" onMouseEnter={pause} onMouseLeave={resume}>
      <style>{`
        .hero-wrap {
          position: relative;
          width: 100%;
          min-height: clamp(300px, 50vh, 720px);
          overflow: hidden;
          background: ${bg};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-stage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center center;
          background: ${bg};
          opacity: 0;
          transition: opacity ${transitionMs}ms ease;
        }

        /* On small screens prefer cover to fill viewport */
        @media (max-width: 640px) {
          .hero-wrap {
            min-height: 400px;
          }
          .hero-img { 
            object-fit: cover;
          }
        }
        .hero-img.active { opacity: 1; }
        .nav {
          position: absolute;
          inset-inline: 0;
          top: 50%;
          display: flex;
          justify-content: space-between;
          transform: translateY(-50%);
          padding: 0 10px;
          pointer-events: none;
          z-index: 10;
        }
        .nav button {
          pointer-events: auto;
          border: 0;
          width: 42px; height: 42px;
          border-radius: 999px;
          background: rgba(255,255,255,.95);
          box-shadow: 0 4px 14px rgba(0,0,0,.08);
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
        }
        .dots {
          position: absolute;
          bottom: 12px; left: 50%;
          transform: translateX(-50%);
          display: flex; gap: 6px;
          z-index: 10;
        }
        /* Make the clickable/touch target at least 24x24 while keeping the
           visible dot small (8x8). Use a pseudo-element for the visual dot so
           layout doesn't change but the hit area meets accessibility guidelines. */
        .dot {
          position: relative;
          padding: 8px; /* ensures at least 24x24 overall hit area (8px*2 + 8px visible)
                         visually keeps the small dot centered */
          background: transparent;
          border: 0;
          cursor: pointer;
        }
        .dot::before {
          content: '';
          display: block;
          width: 8px; height: 8px;
          border-radius: 999px;
          background: rgba(0,0,0,.18);
          transform: translateZ(0);
        }
        .dot.active::before { background: rgba(0,0,0,.55); }
      `}</style>

      {/* Slides (image only) */}
      <div className="hero-stage" aria-live="polite">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className={i === idx ? "hero-img active" : "hero-img"}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            width={1600}
            height={900}
            {...(i === 0 ? {fetchpriority: 'high'} : {})}
          />
        ))}
      </div>

      {/* Dynamically preload the resolved primary image (if present) to help LCP */}
      <DynamicPreload url={images && images.length ? images[0] : null} />

      {/* Controls */}
      {images.length > 1 && (
        <>
          <div className="nav">
            <button aria-label="Previous" onClick={() => go(-1)}>‹</button>
            <button aria-label="Next" onClick={() => go(+1)}>›</button>
          </div>
          <div className="dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={i === idx ? "dot active" : "dot"}
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// Small helper: preload a URL into document head when available
function DynamicPreload({ url }) {
  useEffect(() => {
    if (!url || typeof document === 'undefined') return;
    try {
      const selector = `link[rel="preload"][href="${url}"]`;
      if (document.querySelector(selector)) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
      return () => {
        try { document.head.removeChild(link); } catch (e) { /* ignore */ }
      };
    } catch (e) { /* noop */ }
  }, [url]);

  return null;
}