import { useEffect, useRef } from 'react';
import { useUiStore } from '../store/uiStore';

/**
 * Holding Ctrl activates send mode for as long as it's held, without
 * touching the toggle's own persisted on/off state — releasing it (or
 * losing focus entirely, e.g. alt-tabbing away mid-hold, which can eat the
 * keyup) puts things back exactly where the toggle left them. If send mode
 * was already on via the toggle, holding Ctrl is a no-op both ways: it
 * doesn't need to turn anything on, and releasing it doesn't turn the
 * toggle's own choice off. Does nothing while edit mode is active, since
 * edit mode already forces send mode off itself.
 */
export function useSendModeHotkey() {
  const editingActive = useUiStore((s) => s.editingActive);
  const setSendModeActive = useUiStore((s) => s.setSendModeActive);
  const heldByCtrl = useRef(false);

  useEffect(() => {
    const release = () => {
      if (heldByCtrl.current) {
        heldByCtrl.current = false;
        setSendModeActive(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Control' || e.repeat || editingActive) return;
      if (!useUiStore.getState().sendModeActive) {
        heldByCtrl.current = true;
        setSendModeActive(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') release();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', release);
    };
  }, [editingActive, setSendModeActive]);
}
