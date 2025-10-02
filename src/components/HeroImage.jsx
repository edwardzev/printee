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
}) {
  const [images, setImages] = useState([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const playingRef = useRef(true);

  // Build candidate list: support hero-1..hero-50 and hero_1..hero_50 with common extensions
  const candidates = useMemo(() => {
    const exts = ["webp", "jpg", "png", "jpeg"];
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
    (async () => {
      const found = [];
      // For each numeric index, try to find small/large variants or single file
      for (let i = 1; i <= 50; i++) {
        const baseCandidates = [];
        const exts = ['webp','jpg','png','jpeg'];
        for (const ext of exts) {
          baseCandidates.push(`/hero_images/hero_${i}_sm.${ext}`);
          baseCandidates.push(`/hero_images/hero_${i}_lg.${ext}`);
          baseCandidates.push(`/hero_images/hero_${i}.${ext}`);
          baseCandidates.push(`/hero_images/hero-${i}.${ext}`);
        }
        // Try to load the first available candidate per index
        const res = await (async () => {
          for (const c of baseCandidates) {
            // eslint-disable-next-line no-await-in-loop
            const ok = await tryLoad(c);
            if (ok) return ok;
          }
          return null;
        })();
        if (res) found.push(res);
      }
      if (cancelled) return;
      setImages(shuffle(found));
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [candidates]);

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
          min-height: clamp(240px, 48vh, 720px);
          overflow: hidden;
          background: ${bg};
          /* removed bottom border to avoid visible stray line under header */
        }
        .hero-stage {
          position: absolute;
          inset: 0;
        }
        .hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;   /* default: show full image without cropping */
          object-position: center center;
          background: ${bg};     /* letterboxing color */
          opacity: 0;
          transition: opacity ${transitionMs}ms ease;
        }

        /* On small screens prefer cover to fill viewport */
        @media (max-width: 640px) {
          .hero-img { object-fit: cover; }
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
        }
        .dot {
          width: 8px; height: 8px; border-radius: 999px;
          background: rgba(0,0,0,.18);
          border: 0;
          cursor: pointer;
        }
        .dot.active { background: rgba(0,0,0,.55); }
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
          />
        ))}
      </div>

      {/* Controls */}
      {images.length > 1 && (
        <>
          <div className="nav">
            <button aria-label="Previous" onClick={() => go(-1)}>‹</button>
            <button aria-label="Next" onClick={() => go(+1)}>›</button>
          </div>
          <div className="dots" aria-hidden="true">
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