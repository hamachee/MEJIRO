import type { L10n } from '../types/template';

/**
 * Resolve a multilingual template label for a language, falling back to English
 * and then to the first available value. Keeps UI and Discord output working
 * even when a template has not been translated for the chosen language.
 */
export function label(l10n: L10n, lang: string): string {
  const direct = l10n[lang];
  if (direct) return direct;
  if (l10n.en) return l10n.en;
  const first = Object.values(l10n).find((v) => typeof v === 'string' && v);
  return first ?? '';
}
