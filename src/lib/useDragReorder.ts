import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface DropTarget {
  index: number;
  edge: 'before' | 'after';
}

/**
 * Touch- and mouse-friendly drag-to-reorder for a list, built on Pointer
 * Events rather than the native HTML5 Drag and Drop API — native DnD has no
 * touch support, which would silently break this on every phone. Works for
 * both flex lists and CSS grids: the drop target is whatever item element
 * the pointer is currently over, found via `elementFromPoint`.
 *
 * Rather than highlighting the whole hovered item (which reads like a swap),
 * the pointer's position within that item picks a `before`/`after` edge, so
 * the caller can render a thin insertion line between two items instead —
 * `orientation` picks which axis that edge is measured on: `'list'` (the
 * default) for a single-column stack, where the pointer's vertical half
 * within the item decides above/below it; `'grid'` for a wrapping card grid,
 * where the horizontal half decides left/right.
 *
 * Reordering only commits on release (drop); mid-drag it just tracks the
 * dragged item and the current drop edge, so there's no risk of a stale
 * local copy of `items` drifting from the character store.
 *
 * Usage: spread `handleProps(index)` onto a drag-handle element and
 * `itemProps(index)` onto the item's outer element (needs `data-drag-index`
 * for hit-testing, which `itemProps` sets).
 */
export function useDragReorder<T>(
  items: T[],
  onReorder: (next: T[]) => void,
  orientation: 'list' | 'grid' = 'list',
) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const end = () => {
    if (dragIndex !== null && dropTarget !== null) {
      const rawInsertAt = dropTarget.edge === 'before' ? dropTarget.index : dropTarget.index + 1;
      const insertAt = rawInsertAt > dragIndex ? rawInsertAt - 1 : rawInsertAt;
      if (insertAt !== dragIndex) {
        const next = [...itemsRef.current];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(insertAt, 0, moved);
        onReorder(next);
      }
    }
    setDragIndex(null);
    setDropTarget(null);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragIndex === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const itemEl = el?.closest('[data-drag-index]');
    if (!itemEl) return;
    const idx = Number(itemEl.getAttribute('data-drag-index'));
    if (Number.isNaN(idx)) return;
    const rect = itemEl.getBoundingClientRect();
    const edge: DropTarget['edge'] =
      orientation === 'grid'
        ? e.clientX < rect.left + rect.width / 2
          ? 'before'
          : 'after'
        : e.clientY < rect.top + rect.height / 2
          ? 'before'
          : 'after';
    setDropTarget({ index: idx, edge });
  };

  const handleProps = (index: number) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragIndex(index);
      setDropTarget(null);
    },
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
  });

  const itemProps = (index: number) => {
    const isDropHere =
      dragIndex !== null && dragIndex !== index && dropTarget?.index === index;
    return {
      'data-drag-index': index,
      className: [
        dragIndex === index ? 'dragging' : '',
        isDropHere && dropTarget?.edge === 'before' ? 'drag-line-before' : '',
        isDropHere && dropTarget?.edge === 'after' ? 'drag-line-after' : '',
        isDropHere && orientation === 'grid' ? 'drag-grid' : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  };

  return { handleProps, itemProps, dragging: dragIndex !== null };
}
