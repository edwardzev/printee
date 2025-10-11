import { useState, useEffect } from 'react';

// Robust media query hook that works well on iOS Safari and avoids hydration issues
export function useMediaQuery(query) {
  // On first render (SSR or before hydration), assume mobile for safer UI
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return true;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;

    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);

    // Prefer media query change events
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
    } else if (typeof mql.addListener === 'function') {
      // Safari < 14
      mql.addListener(onChange);
    }

    // Fallback: update on resize as a safety net
    const onResize = () => setMatches(window.innerWidth <= 768);
    window.addEventListener('resize', onResize, { passive: true });

    // Sync immediately
    setMatches(mql.matches);

    return () => {
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', onChange);
      } else if (typeof mql.removeListener === 'function') {
        mql.removeListener(onChange);
      }
      window.removeEventListener('resize', onResize);
    };
  }, [query]);

  return matches;
}