import { useEffect, useRef } from 'react';
import { useUiStore } from '../store/uiStore';
import { IconDiscord } from './icons';

/**
 * A small Discord badge that follows the pointer, offset to its
 * bottom-right (clear of the arrow cursor's own tip), while send mode is
 * on — a constant reminder of what clicking a card will do, wherever the
 * pointer currently is. Position is written directly to the DOM via a ref
 * on every mousemove rather than through React state, so dragging the
 * mouse around doesn't trigger a re-render per pixel.
 */
export function SendModeCursor() {
  const active = useUiStore((s) => s.sendModeActive);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!active) return;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (el) el.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [active]);

  if (!active) return null;
  return (
    <span ref={ref} className="send-mode-cursor" aria-hidden="true">
      <IconDiscord />
    </span>
  );
}
