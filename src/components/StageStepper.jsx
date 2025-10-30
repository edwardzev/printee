import React, { useEffect, useState, useRef } from 'react';

// Right-side vertical stepper with icon-only circular stages and a long guiding line.
// Uses IntersectionObserver to detect the most visible stage and highlights it.
export default function StageStepper({
  stages = [],
  side = 'right',
  offset = 120,
  containerSelector = '#configurator-root', // container to reserve rail padding on narrow screens
  railWidth = 64, // px, matches w-16
  gap = 12 // px distance from content edge
}) {
  const [active, setActive] = useState(stages && stages.length ? stages[0].key : null);
  const observerRef = useRef(null);
  const navRef = useRef(null);
  const cleanupRef = useRef({ appliedPadding: false, originalPaddingRight: null });

  useEffect(() => {
    if (!stages || stages.length === 0) return undefined;
    const opts = {
      root: null,
      rootMargin: `-${offset}px 0px -40% 0px`,
      threshold: [0.15, 0.5, 0.9]
    };

    const cb = (entries) => {
      let best = null;
      for (const e of entries) {
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      }
      if (best && best.isIntersecting) {
        const key = best.target.dataset.stageKey;
        if (key) setActive(key);
      }
    };

    const obs = new IntersectionObserver(cb, opts);
    observerRef.current = obs;
    const observed = new Set();

    const tryObserveAll = () => {
      stages.forEach((s) => {
        if (observed.has(s.targetId)) return;
        const el = document.getElementById(s.targetId);
        if (el) {
          el.dataset.stageKey = s.key;
          obs.observe(el);
          observed.add(s.targetId);
        }
      });
    };

    // initial observe attempt
    tryObserveAll();

    // observe dynamic DOM mutations (e.g., upload stage appears later)
    let mo;
    try {
      mo = new MutationObserver(() => {
        tryObserveAll();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}

    return () => {
      try { obs.disconnect(); } catch (e) {}
      try { mo && mo.disconnect(); } catch (e) {}
      observerRef.current = null;
    };
  }, [stages, offset]);

  // Position below header and anchor relative to the colors panel (stage-color) so distance is from blocks.
  // When the right gutter is too small, reserve an inline rail by adding padding-right to the container.
  useEffect(() => {
    const align = () => {
      try {
        const el = navRef.current;
        if (!el) return;
        el.style.top = 'var(--header-height, 96px)';
        const colorsPanel = document.getElementById('stage-color');
        const elWidth = Math.round(el.getBoundingClientRect().width || railWidth || 0);
          const container = containerSelector ? document.querySelector(containerSelector) : null;
          const resetContainerPadding = () => {
            if (container && cleanupRef.current.appliedPadding) {
              container.style.paddingRight = cleanupRef.current.originalPaddingRight || '';
              cleanupRef.current.appliedPadding = false;
            }
          };

          // On mobile (below md breakpoint) the stepper stays hidden; restore container padding and bail.
          const noStepper = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
          if (noStepper) {
            resetContainerPadding();
            if (el) {
              el.style.right = '16px';
            }
            return;
          }

        if (container) {
          const cs = getComputedStyle(container);
          if (cleanupRef.current.originalPaddingRight === null) {
            cleanupRef.current.originalPaddingRight = cs.paddingRight || '';
          }
          if (cleanupRef.current.appliedPadding) {
            container.style.paddingRight = cleanupRef.current.originalPaddingRight || '';
            cleanupRef.current.appliedPadding = false;
          }
        }

        const resolveContentRight = () => {
          if (colorsPanel) return colorsPanel.getBoundingClientRect().right;
          if (container) {
            const rect = container.getBoundingClientRect();
            const pr = parseFloat(getComputedStyle(container).paddingRight) || 0;
            return rect.right - pr;
          }
          return window.innerWidth - gap - elWidth;
        };

        let contentRight = resolveContentRight();
        let freeSpace = window.innerWidth - contentRight;

        if (freeSpace < elWidth + gap && container) {
          const original = cleanupRef.current.originalPaddingRight || getComputedStyle(container).paddingRight || '0px';
          const originalNum = parseFloat(original) || 0;
          const needed = elWidth + gap;
          container.style.paddingRight = `${originalNum + needed}px`;
          cleanupRef.current.appliedPadding = true;
          contentRight = resolveContentRight();
          freeSpace = window.innerWidth - contentRight;
        }

        const right = Math.max(gap, Math.round(window.innerWidth - contentRight - gap - elWidth));
        el.style.position = 'fixed';
        el.style.right = `${right}px`;
        el.style.left = '';
      } catch (e) {}
    };

    align();
    window.addEventListener('resize', align);
    window.addEventListener('orientationchange', align);
    // Observe colors panel size/position to keep alignment accurate
    let ro;
    let roContainer;
    try {
      const colorsPanel = document.getElementById('stage-color');
      if (colorsPanel && 'ResizeObserver' in window) {
        ro = new ResizeObserver(align);
        ro.observe(colorsPanel);
      }
      const container = containerSelector ? document.querySelector(containerSelector) : null;
      if (container && 'ResizeObserver' in window) {
        roContainer = new ResizeObserver(align);
        roContainer.observe(container);
      }
    } catch (e) {}
    return () => {
      window.removeEventListener('resize', align);
      window.removeEventListener('orientationchange', align);
      try { ro && ro.disconnect && ro.disconnect(); } catch (e) {}
      try { roContainer && roContainer.disconnect && roContainer.disconnect(); } catch (e) {}
      // Cleanup any padding we applied to the container
      try {
        const container = containerSelector ? document.querySelector(containerSelector) : null;
        if (container) {
          if (cleanupRef.current.appliedPadding) {
            container.style.paddingRight = cleanupRef.current.originalPaddingRight || '';
            cleanupRef.current.appliedPadding = false;
          }
        }
      } catch (e) {}
    };
  }, [containerSelector, gap, railWidth]);

  const handleClick = (targetId, key) => {
    try {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // update active immediately for snappy feedback
      setActive(key);
    } catch (e) {}
  };

  const svgForKey = (k, className = 'h-5 w-5') => {
    // monochrome "cool" icons (stroke uses currentColor so color is controlled via text- classes)
    switch (k) {
      case 'color':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 7c0-1.656 1.344-3 3-3h12c1.656 0 3 1.344 3 3v7a3 3 0 01-3 3h-2l-2 2-2-2H9a3 3 0 01-3-3V7z" />
          </svg>
        );
      case 'sizes':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 10v6a2 2 0 01-2 2H7l-4 0V6a2 2 0 012-2h6" />
            <path d="M7 8h6" />
            <path d="M17 4v6" />
          </svg>
        );
      case 'areas':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20l9-5-9-5-9 5 9 5z" />
            <path d="M12 12V4" />
          </svg>
        );
      case 'upload':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
        );
      default:
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
    }
  };

  // fixed container; we set top/right via inline styles for precise alignment
  const containerClass = `hidden md:block fixed bottom-0 z-40 w-16 flex items-center`;

  return (
    <nav aria-label="Configurator stages" className={containerClass} ref={navRef} style={{ top: 'var(--header-height, 96px)', right: 16 }}>
      <div className="relative h-full w-full flex items-center">
        {/* long guiding line centered in the vertical bar */}
  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-slate-300 dark:bg-slate-600 rounded" aria-hidden="true" />

        {/* spread icons evenly from top to bottom */}
  <ol className="relative z-10 flex flex-col justify-between items-center h-full py-2">
          {stages.map((s) => {
            const isActive = active === s.key;
            return (
              <li key={s.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleClick(s.targetId, s.key)}
                  className={`flex items-center justify-center h-12 w-12 rounded-full focus:outline-none transition-transform text-sky-600 ${isActive ? 'bg-sky-50 ring-2 ring-sky-500 shadow-md scale-110' : 'bg-white ring-1 ring-slate-200 hover:bg-sky-50'}`}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={s.label || s.key}
                >
                  {/* svg icons inherit color from button text color */}
                  {svgForKey(s.key, 'h-6 w-6')}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
