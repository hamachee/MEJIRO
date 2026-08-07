import { useTranslation } from 'react-i18next';
import { useUiStore } from '../store/uiStore';

/**
 * Explains send mode while it's on, as a centered line below the sheet
 * toolbar rather than a tooltip on the toggle itself — it stays visible
 * for as long as send mode is active, not just while hovering the switch.
 * Skipped for a momentary Ctrl-hold (see sendModeViaHotkey), same as the
 * app-wide background pattern: a full toolbar line reads as commentary on
 * a deliberate toggle-on, not a passing hold.
 */
export function SendModeHint() {
  const { t } = useTranslation();
  const active = useUiStore((s) => s.sendModeActive);
  const viaHotkey = useUiStore((s) => s.sendModeViaHotkey);
  if (!active || viaHotkey) return null;
  return <p className="send-mode-hint">{t('message.sendModeHintActive')}</p>;
}
