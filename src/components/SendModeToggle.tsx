import { useTranslation } from 'react-i18next';
import { useUiStore } from '../store/uiStore';
import { IconDiscord } from './icons';

/**
 * The table-wide send-mode switch, lived in the message panel until it
 * turned out that made it too easy to leave on without noticing — it now
 * sits in the sheet's own toolbar instead, next to Export, so it stays in
 * view alongside the cards it affects. A physical left-right switch (not a
 * checkbox) reads more clearly as "this changes how clicking works" than a
 * checkbox tucked in a drawer did.
 */
export function SendModeToggle() {
  const { t } = useTranslation();
  const active = useUiStore((s) => s.sendModeActive);
  const toggle = useUiStore((s) => s.toggleSendMode);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={t('message.sendMode')}
      title={t('message.sendModeHint')}
      className={`send-mode-toggle ${active ? 'on' : ''}`}
      onClick={toggle}
    >
      <IconDiscord />
      <span className="send-mode-toggle-track">
        <span className="send-mode-toggle-thumb" />
      </span>
    </button>
  );
}
