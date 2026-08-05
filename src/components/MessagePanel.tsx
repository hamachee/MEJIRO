import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { useDragReorder } from '../lib/useDragReorder';
import { postEmbedMessage } from '../engine/discord';
import { uid } from '../lib/uid';
import { cssHex } from '../lib/color';
import type { MessageTemplate } from '../types/messageTemplate';
import { IconClose, IconTabHandle, IconWarning } from './icons';
import { ListImportExport } from './ListImportExport';

type PostStatus = 'idle' | 'posting' | 'sent' | 'error';

/**
 * Foldable webhook message panel: a drawer that slides out over the page,
 * with a tab handle attached to its left edge. The tab rides the same
 * transform as the drawer, so at rest (drawer off-screen) it sits flush
 * with the viewport's edge — always visible — and once open it protrudes
 * from the drawer like a physical handle; clicking it either way slides
 * the drawer in or out, no separate close button needed. Posts as a
 * Discord embed (title + content, both markdown Discord renders itself —
 * this app adds none), with an optional per-message color that falls back
 * to the sheet's identity color, then the app default. Saved templates are
 * per-device (not part of the character/campaign data) since the same
 * device is often used for different characters or campaigns.
 */
export function MessagePanel({
  webhookUrl,
  identityColor,
}: {
  webhookUrl?: string;
  /** The character's/campaign's identity color, used when the message's own color field is empty. */
  identityColor?: string;
}) {
  const { t } = useTranslation();
  const templates = useSettingsStore((s) => s.settings.messageTemplates);
  const update = useSettingsStore((s) => s.update);
  const [open, setOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('');
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
      await postEmbedMessage(webhookUrl, title, content, color.trim() || identityColor);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const saveTemplate = () => {
    if (!content.trim()) return;
    update({
      messageTemplates: [
        ...templates,
        { id: uid(), title: title.trim(), content: content.trim(), color: color.trim() },
      ],
    });
  };

  const clear = () => {
    setTitle('');
    setContent('');
    setColor('');
    setStatus('idle');
  };

  const effectiveColor = cssHex(color) ?? (identityColor ? cssHex(identityColor) : undefined);

  return (
    <div className={`message-panel ${open ? 'open' : ''}`}>
      <button
        className="message-tab"
        aria-label={t('message.title')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconTabHandle />
      </button>
      <div className="message-panel-body stack">
        <h2>{t('message.title')}</h2>

        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setStatus('idle');
          }}
          placeholder={t('message.titlePlaceholder')}
        />

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setStatus('idle');
          }}
          placeholder={t('message.placeholder')}
          rows={5}
        />

        <label className="field message-color-field">
          <span className="field-label">{t('message.colorLabel')}</span>
          <span className="color-field-row">
            <span className="color-swatch" style={{ background: effectiveColor ?? 'transparent' }} />
            <input
              className="color-input"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setStatus('idle');
              }}
              placeholder={identityColor ? identityColor : '#5B4B8A'}
            />
          </span>
        </label>

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

        <ListImportExport
          kind="messageTemplates"
          items={templates}
          ownerName={t('message.templates')}
          onChange={(next) => update({ messageTemplates: next })}
          compact
        />

        <div className="form-row">
          <button className="grow" onClick={() => setTemplatesOpen((v) => !v)}>
            {t('message.templates')} ({templates.length})
          </button>
        </div>

        {templatesOpen && (
          <div className="stack">
            {templates.length === 0 && <p className="muted">{t('message.noTemplates')}</p>}
            {templates.map((tpl, i) => {
              const drag = itemProps(i);
              return (
                <div key={tpl.id} className={`item-card ${drag.className}`} data-drag-index={i}>
                  <div className="item-card-head">
                    <div className="item-card-title grow">
                      <span className="drag-handle" {...handleProps(i)} />
                      {tpl.color && (
                        <span
                          className="color-swatch"
                          style={{ background: cssHex(tpl.color) ?? 'transparent' }}
                        />
                      )}
                      <button
                        type="button"
                        className="message-template-content"
                        onClick={() => {
                          setTitle(tpl.title);
                          setContent(tpl.content);
                          setColor(tpl.color);
                          setStatus('idle');
                        }}
                      >
                        {tpl.title || tpl.content}
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
    </div>
  );
}
