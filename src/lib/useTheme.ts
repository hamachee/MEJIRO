import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useCharacterStore } from '../store/characterStore';
import { DEFAULT_TEMPLATE_ID } from '../templates';
import { applyTheme, resolveTheme } from './theme';

/**
 * Keep the document's color scheme in sync with the settings. In "by rule"
 * mode the open character's game system picks the scheme; outside a sheet the
 * default system's scheme is used.
 */
export function useTheme(): void {
  const mode = useSettingsStore((s) => s.settings.themeMode);
  const curseColor = useSettingsStore((s) => s.settings.curseColor);
  const templateId = useCharacterStore(
    (s) => s.active?.templateId ?? DEFAULT_TEMPLATE_ID,
  );

  useEffect(() => {
    applyTheme(resolveTheme(mode, curseColor, templateId));
    if (mode !== 'system') return;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(resolveTheme(mode, curseColor, templateId));
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode, curseColor, templateId]);
}
