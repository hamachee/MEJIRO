import { useEffect, useState } from 'react';

// Ignore small jitters (trackpad momentum, mobile rubber-banding) and never
// shrink while still near the very top of the page.
const DELTA_THRESHOLD = 8;
const TOP_THRESHOLD = 40;

/** Shrinks the header while scrolling down, restores it on scroll up. */
export function useHeaderShrink(): boolean {
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y <= TOP_THRESHOLD) {
        setShrink(false);
      } else if (delta > DELTA_THRESHOLD) {
        setShrink(true);
      } else if (delta < -DELTA_THRESHOLD) {
        setShrink(false);
      }
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return shrink;
}
