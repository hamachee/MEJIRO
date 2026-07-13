import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { THEME_MODES } from '../lib/theme';

const MODE_ICONS: Record<string, string> = {
  dark: '🌙',
  light: '☀️',
  rule: '📖',
  custom: '🎨',
};

/** Top-bar button that cycles dark → light → by-rule → custom. */
export function ThemeToggle() {
  const { t } = useTranslation();
  const mode = useSettingsStore((s) => s.settings.themeMode);
  const update = useSettingsStore((s) => s.update);

  const next = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
  const label = `${t('theme.label')}: ${t(`theme.${mode}`)}`;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => update({ themeMode: next })}
      title={label}
      aria-label={label}
    >
      <span aria-hidden="true">{MODE_ICONS[mode]}</span>
    </button>
  );
}
