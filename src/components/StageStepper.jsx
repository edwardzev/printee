import React, { useEffect, useState, useRef, useCallback } from 'react';

const ICON_BASE_PATH = '/schematics/stepper_icons';

const ICON_FILE_MAP = {
  color: 'color_icon.png',
  sizes: 'sizes_icon.png',
  areas: 'area_icon.png',
  upload: 'upload_icon.png'
};

const STAGE_HINTS = {
  color: 'צבע מוצר',
  sizes: 'מידות',
  areas: 'מיקום הדפסה',
  upload: 'העלאת קובץ'
};

const StageIcon = ({ stageKey, label, className, fallback }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [stageKey]);
  const fileName = ICON_FILE_MAP[stageKey] || `${stageKey}.png`;
  const src = `${ICON_BASE_PATH}/${fileName}`;

  if (failed && fallback) {
    return typeof fallback === 'function' ? fallback() : fallback;
  }

  return (
    <img
      src={src}
      alt={label || stageKey}
      className={`${className} object-contain`}
      loading="lazy"
      decoding="async"
      onError={() => {
        setFailed(true);
      }}
    />
  );
};

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
  const stageEntriesRef = useRef([]);
  const navRef = useRef(null);
  const cleanupRef = useRef({ appliedPadding: false, originalPaddingRight: null });
  const rafRef = useRef(null);

  const collectStageEntries = useCallback(() => {
    if (!Array.isArray(stages)) {
      stageEntriesRef.current = [];
      return;
    }
    const entries = stages
      .map((s) => {
        const el = document.getElementById(s.targetId);
        if (!el) return null;
        el.dataset.stageKey = s.key;
        return { key: s.key, targetId: s.targetId, element: el };
      })
      .filter(Boolean);
    stageEntriesRef.current = entries;
  }, [stages]);

  const updateActiveFromScroll = useCallback(() => {
    const entries = stageEntriesRef.current;
    if (!entries || entries.length === 0) return;

    const anchor = typeof offset === 'number' ? offset : 120;
    const viewportHeight = window.innerHeight || 1;

    let nextKey = entries[0]?.key;
    let bestScore = -Infinity;

    entries.forEach(({ key, element }) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, viewportHeight);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;
      const coversAnchor = rect.top <= anchor && rect.bottom >= anchor;
      const center = rect.top + rect.height / 2;
      const distanceScore = -Math.abs(center - anchor) / viewportHeight;
      let score = distanceScore;
      if (coversAnchor) {
        score += 2; // strongly prefer the section that spans the anchor line
      }
      score += ratio; // prefer visible sections even if anchor is between
      if (score > bestScore) {
        bestScore = score;
        nextKey = key;
      }
    });

    setActive((prev) => (prev === nextKey ? prev : nextKey));
  }, [offset]);

  useEffect(() => {
    const scheduleUpdate = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        updateActiveFromScroll();
      });
    };

    collectStageEntries();
    updateActiveFromScroll();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);

    let mo;
    try {
      mo = new MutationObserver(() => {
        collectStageEntries();
        updateActiveFromScroll();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      try { mo && mo.disconnect(); } catch (e) {}
    };
  }, [collectStageEntries, updateActiveFromScroll]);

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
    <div className="absolute inset-y-0 left-[63%] -translate-x-[63%] w-1 bg-slate-300 dark:bg-slate-600 rounded" aria-hidden="true" />

        {/* spread icons evenly from top to bottom */}
        <ol className="relative z-10 flex flex-col justify-between items-center h-full py-4">
          {stages.map((s) => {
            const isActive = active === s.key;
            const hint = STAGE_HINTS[s.key];
            const hintId = hint ? `stage-stepper-hint-${s.key}` : undefined;
            return (
              <li key={s.key} className="w-full flex items-center justify-center">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => handleClick(s.targetId, s.key)}
                    className={`flex items-center justify-center h-12 w-12 rounded-full focus:outline-none transition-shadow text-sky-600 ${isActive ? 'bg-sky-50 ring-2 ring-sky-500 shadow-lg' : 'bg-white ring-1 ring-slate-200 hover:bg-sky-50'}`}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={s.label || s.key}
                    aria-describedby={hintId}
                    tabIndex={0}
                  >
                    <StageIcon
                      stageKey={s.key}
                      label={s.label || s.key}
                      className="h-6 w-6"
                      fallback={() => svgForKey(s.key, 'h-6 w-6')}
                    />
                  </button>
                  {hint ? (
                    <span
                      id={hintId}
                      role="tooltip"
                      className="pointer-events-none absolute top-1/2 right-full mr-3 -translate-y-1/2 whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100"
                    >
                      {hint}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
