import { useEffect, useState } from 'react';

const QUERY = '(min-width: 1000px)';

/** True on desktop-width viewports; tracks live resizes. */
export function useWide(): boolean {
  const [wide, setWide] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
}
