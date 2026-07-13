import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { SUPPORTED_LANGUAGES } from '../i18n';

export function Settings() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

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
        <p className="muted hint">{t('settings.webhookMoved')}</p>
      </section>

      <p className="muted disclaimer">{t('settings.fanDisclaimer')}</p>
    </div>
  );
}
