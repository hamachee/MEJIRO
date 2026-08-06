import { useEffect, useRef } from 'react';
import { useUiStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';

/** How long Ctrl must be held alone before it counts as a hold gesture, not a shortcut's modifier. */
const HOLD_DELAY_MS = 620;

/**
 * Holding Ctrl activates send mode for as long as it's held, without
 * touching the toggle's own persisted on/off state — releasing it (or
 * losing focus entirely, e.g. alt-tabbing away mid-hold, which can eat the
 * keyup) puts things back exactly where the toggle left them. If send mode
 * was already on via the toggle, holding Ctrl is a no-op both ways: it
 * doesn't need to turn anything on, and releasing it doesn't turn the
 * toggle's own choice off. Does nothing while edit mode is active, since
 * edit mode already forces send mode off itself.
 *
 * Ctrl is also every browser/OS shortcut's modifier (Ctrl+C, Ctrl+Tab, …),
 * so a bare keydown isn't enough signal on its own — activation waits
 * HOLD_DELAY_MS, and any other key pressed before that timer fires (i.e.
 * Ctrl was actually being used as a shortcut's modifier) cancels it. A
 * deliberate hold is comfortably longer than a shortcut's keydown gap, so
 * this filters out normal Ctrl+key use without adding perceptible lag to
 * the real gesture.
 *
 * Can be turned off entirely from Settings (some users just want Ctrl to
 * keep doing whatever it already does everywhere else).
 */
export function useSendModeHotkey() {
  const editingActive = useUiStore((s) => s.editingActive);
  const setSendModeActive = useUiStore((s) => s.setSendModeActive);
  const setSendModeViaHotkey = useUiStore((s) => s.setSendModeViaHotkey);
  const disabled = useSettingsStore((s) => s.settings.disableSendModeHotkey);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activatedByHotkey = useRef(false);

  useEffect(() => {
    if (disabled) return;
    const clearPending = () => {
      if (pendingTimer.current) {
        clearTimeout(pendingTimer.current);
        pendingTimer.current = null;
      }
    };
    const deactivate = () => {
      clearPending();
      if (activatedByHotkey.current) {
        activatedByHotkey.current = false;
        setSendModeActive(false);
        setSendModeViaHotkey(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Control') {
        // Any other key while Ctrl is pending/held means Ctrl was a
        // shortcut's modifier (Ctrl+C, Ctrl+Tab, …), not a hold gesture.
        if (pendingTimer.current || activatedByHotkey.current) deactivate();
        return;
      }
      if (e.repeat || editingActive) return;
      if (pendingTimer.current || activatedByHotkey.current) return;
      if (useUiStore.getState().sendModeActive) return; // already on via the toggle
      pendingTimer.current = setTimeout(() => {
        pendingTimer.current = null;
        const state = useUiStore.getState();
        if (state.editingActive || state.sendModeActive) return;
        activatedByHotkey.current = true;
        setSendModeActive(true);
        setSendModeViaHotkey(true);
      }, HOLD_DELAY_MS);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') deactivate();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', deactivate);
    return () => {
      clearPending();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', deactivate);
    };
  }, [editingActive, disabled, setSendModeActive, setSendModeViaHotkey]);
}
