import { useEffect, useMemo } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { applyTheme, resolveTheme, type ResolvedTheme } from './theme';

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

/**
 * The currently active resolved theme, recomputed only when mode or the
 * curse-color override change — for reading a real theme color (e.g. to
 * camouflage an empty color-picker swatch against `theme.card`) without a
 * `getComputedStyle` round-trip through the DOM.
 */
export function useResolvedTheme(): ResolvedTheme {
  const mode = useSettingsStore((s) => s.settings.themeMode);
  const curseColor = useSettingsStore((s) => s.settings.curseColor);
  return useMemo(() => resolveTheme(mode, curseColor), [mode, curseColor]);
}
