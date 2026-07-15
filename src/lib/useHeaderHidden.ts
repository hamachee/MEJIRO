import { useEffect, useState } from 'react';

// Ignore small jitters (trackpad momentum, mobile rubber-banding) and never
// hide while still near the very top of the page.
const DELTA_THRESHOLD = 8;
const TOP_THRESHOLD = 40;

/** Slides the header out while scrolling down, back in on scroll up. */
export function useHeaderHidden(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y <= TOP_THRESHOLD) {
        setHidden(false);
      } else if (delta > DELTA_THRESHOLD) {
        setHidden(true);
      } else if (delta < -DELTA_THRESHOLD) {
        setHidden(false);
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

  return hidden;
}
