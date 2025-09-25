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

  // Build candidate list hero-1..hero-30 with multiple extensions
  const candidates = useMemo(() => {
    const exts = ["webp", "jpg", "png", "jpeg"];
    const out = [];
    for (let i = 1; i <= 30; i++) {
      for (const ext of exts) out.push(`/hero_images/hero-${i}.${ext}`);
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
      const results = await Promise.all(candidates.map((u) => tryLoad(u)));
      if (cancelled) return;
      const ok = results.filter(Boolean);
      const randomized = shuffle(ok);
      setImages(randomized);
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
          min-height: clamp(360px, 62vh, 720px);
          overflow: hidden;
          background: ${bg};
          border-bottom: 1px solid #eceff3;
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
          object-fit: contain;   /* show full image without cropping */
          object-position: center center;
          background: ${bg};     /* letterboxing color */
          opacity: 0;
          transition: opacity ${transitionMs}ms ease;
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