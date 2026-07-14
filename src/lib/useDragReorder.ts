import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * Touch- and mouse-friendly drag-to-reorder for a list, built on Pointer
 * Events rather than the native HTML5 Drag and Drop API — native DnD has no
 * touch support, which would silently break this on every phone. Works for
 * both flex lists and CSS grids: the drop target is whatever item element
 * the pointer is currently over, found via `elementFromPoint`.
 *
 * Reordering only commits on release (drop); mid-drag it just highlights the
 * dragged item and the current drop target, so there's no risk of a stale
 * local copy of `items` drifting from the character store.
 *
 * Usage: spread `handleProps(index)` onto a drag-handle element and
 * `itemProps(index)` onto the item's outer element (needs `data-drag-index`
 * for hit-testing, which `itemProps` sets).
 */
export function useDragReorder<T>(items: T[], onReorder: (next: T[]) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const end = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const next = [...itemsRef.current];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIndex, 0, moved);
      onReorder(next);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragIndex === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const itemEl = el?.closest('[data-drag-index]');
    const idx = itemEl ? Number(itemEl.getAttribute('data-drag-index')) : NaN;
    if (!Number.isNaN(idx)) setOverIndex(idx);
  };

  const handleProps = (index: number) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragIndex(index);
      setOverIndex(index);
    },
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
  });

  const itemProps = (index: number) => ({
    'data-drag-index': index,
    className: [
      dragIndex === index ? 'dragging' : '',
      overIndex === index && dragIndex !== null && dragIndex !== index ? 'drag-over' : '',
    ]
      .filter(Boolean)
      .join(' '),
  });

  return { handleProps, itemProps, dragging: dragIndex !== null };
}
