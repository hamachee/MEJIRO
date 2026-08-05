import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { useDragReorder } from '../lib/useDragReorder';
import { postPlainMessage } from '../engine/discord';
import { uid } from '../lib/uid';
import type { MessageTemplate } from '../types/messageTemplate';
import { IconChat, IconClose, IconWarning } from './icons';
import { ListImportExport } from './ListImportExport';

type PostStatus = 'idle' | 'posting' | 'sent' | 'error';

/**
 * Foldable webhook message panel: an always-visible toggle (top right) that
 * slides a drawer in over the page. Free-form text posts as-is to Discord,
 * which renders its own markdown — this app does none. Saved templates are
 * per-device (not part of the character/campaign data) since the same
 * device is often used for different characters or campaigns.
 */
export function MessagePanel({ webhookUrl }: { webhookUrl?: string }) {
  const { t } = useTranslation();
  const templates = useSettingsStore((s) => s.settings.messageTemplates);
  const update = useSettingsStore((s) => s.update);
  const [open, setOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<PostStatus>('idle');
  const [error, setError] = useState('');
  const { handleProps, itemProps } = useDragReorder<MessageTemplate>(
    templates,
    (next) => update({ messageTemplates: next }),
  );

  const send = async () => {
    if (!webhookUrl || !content.trim()) return;
    setStatus('posting');
    try {
      await postPlainMessage(webhookUrl, content);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const saveTemplate = () => {
    if (!content.trim()) return;
    update({ messageTemplates: [...templates, { id: uid(), content: content.trim() }] });
  };

  const clear = () => {
    setContent('');
    setStatus('idle');
  };

  return (
    <>
      <button
        className="message-toggle"
        aria-label={t('message.title')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconChat />
      </button>
      <div className={`message-panel stack ${open ? 'open' : ''}`}>
        <div className="item-card-head">
          <h2>{t('message.title')}</h2>
          <button className="chip ghost" aria-label={t('common.close')} onClick={() => setOpen(false)}>
            <IconClose />
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setStatus('idle');
          }}
          placeholder={t('message.placeholder')}
          rows={5}
        />

        <div className="form-row">
          <button
            className="primary"
            disabled={!webhookUrl || !content.trim() || status === 'posting'}
            onClick={send}
          >
            {t('message.send')}
          </button>
          <button disabled={!content.trim()} onClick={saveTemplate}>
            {t('message.saveTemplate')}
          </button>
          <button disabled={!content.trim()} onClick={clear}>
            {t('message.clear')}
          </button>
        </div>

        <div className="post-status">
          {!webhookUrl && (
            <span className="danger-text">
              <IconWarning /> {t('message.noWebhook')}
            </span>
          )}
          {status === 'posting' && <span className="muted">{t('message.posting')}</span>}
          {status === 'sent' && <span className="ok">{t('message.sent')}</span>}
          {status === 'error' && (
            <span className="danger-text">
              <IconWarning /> {t('message.postError', { message: error })}
            </span>
          )}
        </div>

        <div className="list-io">
          <button className="grow" onClick={() => setTemplatesOpen((v) => !v)}>
            {t('message.templates')} ({templates.length})
          </button>
        </div>

        {templatesOpen && (
          <div className="stack">
            <ListImportExport
              kind="messageTemplates"
              items={templates}
              ownerName={t('message.templates')}
              onChange={(next) => update({ messageTemplates: next })}
            />
            {templates.length === 0 && <p className="muted">{t('message.noTemplates')}</p>}
            {templates.map((tpl, i) => {
              const drag = itemProps(i);
              return (
                <div key={tpl.id} className={`item-card ${drag.className}`} data-drag-index={i}>
                  <div className="item-card-head">
                    <div className="item-card-title grow">
                      <span className="drag-handle" {...handleProps(i)} />
                      <button
                        type="button"
                        className="message-template-content"
                        onClick={() => setContent(tpl.content)}
                      >
                        {tpl.content}
                      </button>
                    </div>
                    <div className="item-card-actions">
                      <button
                        className="chip ghost"
                        aria-label={t('message.confirmDeleteTemplate')}
                        onClick={() => {
                          if (!confirm(t('message.confirmDeleteTemplate'))) return;
                          update({ messageTemplates: templates.filter((x) => x.id !== tpl.id) });
                        }}
                      >
                        <IconClose />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
