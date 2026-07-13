import { useSettingsStore } from '../store/settingsStore';
import { SUPPORTED_LANGUAGES } from '../i18n';
import { useLang } from '../lib/useLang';

export function LanguageSwitcher() {
  const lang = useLang();
  const update = useSettingsStore((s) => s.update);

  return (
    <select
      className="lang-switcher"
      value={lang}
      onChange={(e) => update({ uiLang: e.target.value })}
      aria-label="Language"
    >
      {SUPPORTED_LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
