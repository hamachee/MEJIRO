import { useEffect, useRef, useState } from 'react';
import { postEmbedMessage } from '../engine/discord';
import { useUiStore } from '../store/uiStore';

export type SendStatus = 'idle' | 'posting' | 'sent' | 'error';

/**
 * Turns a card into a click-to-send-to-Discord target while the table's
 * send mode is on. `buildContent` is called at click time (not render time)
 * so the posted text reflects whatever the card currently shows, not a
 * stale closure from whenever the card first mounted.
 *
 * Confirmation is a floating Yes/No pair centered on the click point itself
 * (see `.send-confirm-yes`/`.send-confirm-no` in styles.css) rather than a
 * modal that forces the pointer to travel — clicking again in roughly the
 * same spot is the whole gesture. Clicking anywhere outside the popover
 * dismisses it without sending.
 */
export function useSendableCard({
  webhookUrl,
  embedColor,
  title,
  buildContent,
}: {
  webhookUrl?: string;
  embedColor?: string;
  title: string;
  buildContent: () => string;
}) {
  const active = useUiStore((s) => s.sendModeActive);
  const [confirm, setConfirm] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState<SendStatus>('idle');
  const [error, setError] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirm) return;
    const onPointerDown = (e: PointerEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      setConfirm(null);
    };
    // Capture phase: fires before the card's own overlay onClick, which
    // would otherwise immediately reopen the popover at the new position.
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [confirm]);

  const openConfirm = (e: { clientX: number; clientY: number; preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('idle');
    setError('');
    setConfirm({ x: e.clientX, y: e.clientY });
  };

  const cancel = () => setConfirm(null);

  const send = async () => {
    if (!webhookUrl) {
      setStatus('error');
      setError('noWebhook');
      return;
    }
    setStatus('posting');
    try {
      await postEmbedMessage(webhookUrl, title, buildContent(), embedColor);
      setStatus('sent');
      setTimeout(() => setConfirm(null), 900);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return { active, confirm, popoverRef, openConfirm, cancel, send, status, error };
}
