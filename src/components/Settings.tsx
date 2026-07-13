import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { SUPPORTED_LANGUAGES } from '../i18n';
import {
  DEFAULT_CUSTOM_THEME,
  PALETTE_KEYS,
  THEME_MODES,
  type CustomTheme,
  type ThemeMode,
} from '../lib/theme';

export function Settings() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

  const patchCustom = (patch: Partial<CustomTheme>) =>
    update({ customTheme: { ...settings.customTheme, ...patch } });

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

      <section className="card">
        <h2>{t('settings.appearance')}</h2>
        <div className="form-row">
          <label className="field grow">
            <span className="field-label">{t('theme.label')}</span>
            <select
              value={settings.themeMode}
              onChange={(e) =>
                update({ themeMode: e.target.value as ThemeMode })
              }
            >
              {THEME_MODES.map((m) => (
                <option key={m} value={m}>
                  {t(`theme.${m}`)}
                </option>
              ))}
            </select>
          </label>
          {settings.themeMode === 'custom' && (
            <label className="field">
              <span className="field-label">{t('theme.base')}</span>
              <select
                value={settings.customTheme.base}
                onChange={(e) =>
                  patchCustom({ base: e.target.value as 'dark' | 'light' })
                }
              >
                <option value="dark">{t('theme.dark')}</option>
                <option value="light">{t('theme.light')}</option>
              </select>
            </label>
          )}
        </div>
        {settings.themeMode === 'rule' && (
          <p className="muted hint">{t('theme.ruleHint')}</p>
        )}
        {settings.themeMode === 'custom' && (
          <>
            <div className="swatch-grid">
              {PALETTE_KEYS.map((key) => (
                <label key={key} className="swatch">
                  <input
                    type="color"
                    value={settings.customTheme[key]}
                    onChange={(e) => patchCustom({ [key]: e.target.value })}
                  />
                  <span>{t(`theme.colors.${key}`)}</span>
                </label>
              ))}
            </div>
            <div className="form-row">
              <button
                type="button"
                onClick={() => update({ customTheme: DEFAULT_CUSTOM_THEME })}
              >
                {t('theme.reset')}
              </button>
            </div>
          </>
        )}
      </section>

      <p className="muted disclaimer">{t('settings.fanDisclaimer')}</p>
    </div>
  );
}
