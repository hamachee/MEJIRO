import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { applyTheme, resolveTheme } from './theme';

/** Keep the document's color scheme in sync with the settings. */
export function useTheme(): void {
  const mode = useSettingsStore((s) => s.settings.themeMode);
  const curseColor = useSettingsStore((s) => s.settings.curseColor);

  useEffect(() => {
    applyTheme(resolveTheme(mode, curseColor));
    if (mode !== 'system') return;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(resolveTheme(mode, curseColor));
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode, curseColor]);
}
