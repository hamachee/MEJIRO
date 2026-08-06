import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { THEME_MODES, type ThemeMode } from '../lib/theme';
import { useResolvedTheme } from '../lib/useTheme';
import { pickerValue } from '../lib/color';

export function Settings() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const theme = useResolvedTheme();

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
        </div>
        <label className="field-check">
          <input
            type="checkbox"
            checked={settings.disableSendModeHotkey}
            onChange={(e) => update({ disableSendModeHotkey: e.target.checked })}
          />
          <span>{t('settings.disableSendModeHotkey')}</span>
        </label>
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
        </div>
        {settings.themeMode === 'curseborne' && (
          <p className="muted hint">{t('theme.curseborneHint')}</p>
        )}

        <div className="form-row">
          <label className="field grow">
            <span className="field-label">{t('theme.curseColor')}</span>
            <span className="color-field-row">
              <input
                type="color"
                // Falls back to the active scheme's own curse color (not a
                // fixed default) — that's the color actually in effect when
                // this field is empty, whichever theme happens to be picked.
                value={pickerValue(settings.curseColor, theme.curse)}
                onChange={(e) => update({ curseColor: e.target.value })}
              />
              <input
                key={settings.curseColor}
                className="color-input"
                placeholder="#B44AE0"
                defaultValue={settings.curseColor}
                onBlur={(e) => update({ curseColor: e.target.value.trim() })}
              />
              <button
                type="button"
                disabled={!settings.curseColor}
                onClick={() => update({ curseColor: '' })}
              >
                {t('theme.reset')}
              </button>
            </span>
          </label>
        </div>
        <p className="muted hint">{t('theme.curseColorHint')}</p>

        <span className="field-label">{t('theme.preview')}</span>
        <div className="theme-preview">
          <div className="dice-tray">
            <span className="die d10 mini hit">8</span>
            <span className="die d10 mini curse hit">10</span>
            <span className="die d10 mini">3</span>
          </div>
        </div>
      </section>

      <p className="muted disclaimer">{t('settings.fanDisclaimer')}</p>
    </div>
  );
}
