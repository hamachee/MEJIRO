import { useTranslation } from 'react-i18next';
import { useUiStore } from '../store/uiStore';

/**
 * Explains send mode while it's on, as a centered line below the sheet
 * toolbar rather than a tooltip on the toggle itself — it stays visible
 * for as long as send mode is active, not just while hovering the switch.
 */
export function SendModeHint() {
  const { t } = useTranslation();
  const active = useUiStore((s) => s.sendModeActive);
  if (!active) return null;
  return <p className="send-mode-hint">{t('message.sendModeHintActive')}</p>;
}
