import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { SUPPORTED_LANGUAGES } from '../i18n';

function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function Settings() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const addWebhook = async () => {
    if (!url.trim()) return;
    const hook = { id: uid(), label: label.trim() || 'Discord', url: url.trim() };
    const webhooks = [...settings.webhooks, hook];
    await update({
      webhooks,
      activeWebhookId: settings.activeWebhookId ?? hook.id,
    });
    setLabel('');
    setUrl('');
  };

  const removeWebhook = async (id: string) => {
    const webhooks = settings.webhooks.filter((w) => w.id !== id);
    const activeWebhookId =
      settings.activeWebhookId === id
        ? (webhooks[0]?.id ?? null)
        : settings.activeWebhookId;
    await update({ webhooks, activeWebhookId });
  };

  return (
    <div className="stack">
      <section className="card">
        <h1>{t('settings.title')}</h1>
        <div className="form-row">
          <label className="field grow">
            <span className="field-label">{t('settings.uiLanguage')}</span>
            <select
              value={settings.uiLang}
              onChange={(e) => update({ uiLang: e.target.value })}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field grow">
            <span className="field-label">{t('settings.discordLanguage')}</span>
            <select
              value={settings.discordLang}
              onChange={(e) => update({ discordLang: e.target.value })}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h2>{t('settings.webhooks')}</h2>
        {settings.webhooks.length === 0 ? (
          <p className="muted">{t('settings.noWebhooks')}</p>
        ) : (
          <ul className="webhook-list">
            {settings.webhooks.map((w) => (
              <li key={w.id} className="webhook-item">
                <label className="webhook-active">
                  <input
                    type="radio"
                    name="active-webhook"
                    checked={settings.activeWebhookId === w.id}
                    onChange={() => update({ activeWebhookId: w.id })}
                  />
                  <span>
                    <strong>{w.label}</strong>
                    <small className="muted webhook-url">{w.url}</small>
                  </span>
                </label>
                <button className="danger" onClick={() => removeWebhook(w.id)}>
                  {t('settings.removeWebhook')}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="form-row">
          <input
            placeholder={t('settings.webhookLabel')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="grow"
            placeholder={t('settings.webhookUrl')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button className="primary" onClick={addWebhook}>
            {t('settings.addWebhook')}
          </button>
        </div>
      </section>

      <p className="muted disclaimer">{t('settings.fanDisclaimer')}</p>
    </div>
  );
}
