import { useTranslation } from 'react-i18next';
import type { SendStatus } from '../lib/useSendableCard';
import { IconDiscord, IconWarning } from './icons';

/**
 * The Yes/No pair (and posting status) that floats at the exact point a
 * sendable card was clicked. Rendered by each sendable card itself, right
 * next to its overlay, so it sits above that card specifically.
 */
export function SendConfirmPopover({
  confirm,
  popoverRef,
  cancel,
  send,
  status,
  error,
}: {
  confirm: { x: number; y: number } | null;
  popoverRef: React.RefObject<HTMLDivElement>;
  cancel: () => void;
  send: () => void;
  status: SendStatus;
  error: string;
}) {
  const { t } = useTranslation();
  if (!confirm) return null;

  return (
    <div
      ref={popoverRef}
      className="send-confirm"
      style={{ left: confirm.x, top: confirm.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="send-confirm-prompt">{t('send.confirmPrompt')}</span>
      <button
        type="button"
        className="send-confirm-yes"
        onClick={send}
        disabled={status === 'posting' || status === 'sent'}
        aria-label={t('send.yes')}
      >
        {status === 'sent' ? '✓' : <IconDiscord />}
      </button>
      <button
        type="button"
        className="send-confirm-no"
        onClick={cancel}
        aria-label={t('send.no')}
      >
        ✕
      </button>
      {status === 'error' && (
        <span className="send-confirm-status danger-text">
          <IconWarning />{' '}
          {error === 'noWebhook' ? t('send.noWebhook') : t('send.error', { message: error })}
        </span>
      )}
      {status === 'posting' && <span className="send-confirm-status muted">{t('send.posting')}</span>}
    </div>
  );
}
