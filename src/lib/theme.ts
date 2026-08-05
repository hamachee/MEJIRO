/**
 * Color scheme system. Four modes:
 *  - system: follows the OS/browser's prefers-color-scheme
 *  - dark / light: neutral built-in schemes
 *  - rule: the scheme of the game system (template) being played —
 *    e.g. the violet Curseborne palette
 *
 * On top of whichever mode is active, the user can independently recolor
 * the curse dice (and their hit/border shades) via a single hex value that
 * persists across every mode — it isn't a "theme" of its own.
 *
 * A theme is a flat map of CSS custom properties applied to <html>, so
 * styles.css only ever reads variables. The `:root` block in styles.css
 * keeps the Curseborne values as the pre-JS fallback.
 */
import { cssHex } from './color';

export type ThemeMode = 'system' | 'dark' | 'light' | 'rule';

export const THEME_MODES: ThemeMode[] = ['system', 'dark', 'light', 'rule'];

/**
 * Tokens that make up a color scheme (translucent bars, dividers, readable
 * text tints, curse violet — everything styles.css reads as a CSS var).
 */
export interface Theme {
  bg: string;
  bg2: string;
  card: string;
  card2: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  success: string;
  failure: string;
  danger: string;
  curse: string;
  headerBg: string;
  barBg: string;
  scrim: string;
  divider: string;
  dividerStrong: string;
  onAccent: string;
  successText: string;
  failureText: string;
  dangerText: string;
  failureBright: string;
  failureTerminal: string;
  curseStrong: string;
  curseHitBorder: string;
  curseText: string;
  wickedText: string;
  cruelText: string;
  /** Value for the CSS `color-scheme` property (native widgets, scrollbars). */
  scheme: 'dark' | 'light';
}

const DARK_EXTRAS = {
  headerBg: 'rgba(22, 24, 29, 0.9)',
  barBg: 'rgba(28, 31, 38, 0.95)',
  scrim: 'rgba(10, 10, 18, 0.65)',
  divider: 'rgba(255, 255, 255, 0.05)',
  dividerStrong: 'rgba(255, 255, 255, 0.08)',
  onAccent: '#ffffff',
  successText: '#7ee0ac',
  failureText: '#f0a0a0',
  dangerText: '#f0b8ac',
  failureBright: '#ff9a9a',
  failureTerminal: '#ff6b6b',
  curseStrong: '#7d2ea8',
  curseHitBorder: '#cf6cf2',
  curseText: '#dfa2f5',
  wickedText: '#dfa2f5',
  cruelText: '#f08cc0',
};

const LIGHT_EXTRAS = {
  headerBg: 'rgba(242, 241, 247, 0.9)',
  barBg: 'rgba(231, 229, 240, 0.95)',
  scrim: 'rgba(40, 38, 60, 0.45)',
  divider: 'rgba(0, 0, 0, 0.08)',
  dividerStrong: 'rgba(0, 0, 0, 0.12)',
  onAccent: '#ffffff',
  successText: '#1e7a4d',
  failureText: '#a03636',
  dangerText: '#a53c24',
  failureBright: '#c22f2f',
  failureTerminal: '#8a1a1a',
  curseStrong: '#7d2ea8',
  curseHitBorder: '#b44ae0',
  curseText: '#7d2ea8',
  wickedText: '#8a2eb8',
  cruelText: '#a03470',
};

/** Neutral slate dark scheme. */
export const DARK_THEME: Theme = {
  scheme: 'dark',
  bg: '#16181d',
  bg2: '#1c1f26',
  card: '#232730',
  card2: '#2b303c',
  border: '#3a4150',
  text: '#e8eaf0',
  muted: '#98a0b3',
  accent: '#6e9bd8',
  accent2: '#46608a',
  success: '#4caf7d',
  failure: '#b05454',
  danger: '#c0563f',
  curse: '#b44ae0',
  ...DARK_EXTRAS,
};

/** Neutral light scheme. */
export const LIGHT_THEME: Theme = {
  scheme: 'light',
  bg: '#f2f1f7',
  bg2: '#e7e5f0',
  card: '#ffffff',
  card2: '#efedf6',
  border: '#c9c5dd',
  text: '#23223a',
  muted: '#6b6885',
  accent: '#5b44b8',
  accent2: '#6d5ac2',
  success: '#2c8a5c',
  failure: '#b04545',
  danger: '#b5482f',
  curse: '#a13ecf',
  ...LIGHT_EXTRAS,
};

/** The original MEJIRO look — violet dark, themed for Curseborne. */
export const CURSEBORNE_THEME: Theme = {
  scheme: 'dark',
  bg: '#14141f',
  bg2: '#1c1c2b',
  card: '#23233a',
  card2: '#2b2b45',
  border: '#3a3a5a',
  text: '#e9e8f2',
  muted: '#9b9ab5',
  accent: '#8b76d9',
  accent2: '#5b4b8a',
  success: '#4caf7d',
  failure: '#b05454',
  danger: '#c0563f',
  curse: '#b44ae0',
  ...DARK_EXTRAS,
  headerBg: 'rgba(20, 20, 31, 0.9)',
  barBg: 'rgba(28, 28, 43, 0.95)',
};

/** Per-game-system schemes used by the "by rule" mode, keyed by template id. */
export const RULE_THEMES: Record<string, Theme> = {
  curseborne: CURSEBORNE_THEME,
};

/**
 * "#rrggbb" mixed toward black (amount < 0) or white (amount > 0) by
 * |amount| (0-1). Used to derive the curse-hit shades from the single
 * user-picked curse color, the same way the built-in themes hand-pick a
 * darker/lighter pair around their own curse hue.
 */
function shadeHex(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c: number) =>
    Math.round(amount > 0 ? c + (255 - c) * amount : c * (1 + amount));
  const clamp = (c: number) => Math.max(0, Math.min(255, c));
  const toHex = (c: number) => clamp(c).toString(16).padStart(2, '0');
  return `#${toHex(mix((n >> 16) & 255))}${toHex(mix((n >> 8) & 255))}${toHex(mix(n & 255))}`;
}

/** Whether the OS/browser is currently set to prefer a dark color scheme. */
function systemPrefersDark(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/**
 * Resolve the theme to render. In rule mode the game system decides: the
 * active character's template picks its scheme (falling back to dark for
 * systems without one). A valid `curseColor` then overrides the curse die
 * and its derived hit/border shades on top of whichever base was picked —
 * it applies the same way in every mode, dark/light/rule/system alike.
 */
export function resolveTheme(
  mode: ThemeMode,
  curseColor: string,
  ruleTemplateId?: string,
): Theme {
  const base = (() => {
    switch (mode) {
      case 'light':
        return LIGHT_THEME;
      case 'rule':
        return (ruleTemplateId && RULE_THEMES[ruleTemplateId]) || CURSEBORNE_THEME;
      case 'system':
        return systemPrefersDark() ? DARK_THEME : LIGHT_THEME;
      case 'dark':
      default:
        return DARK_THEME;
    }
  })();

  const curse = cssHex(curseColor);
  if (!curse) return base;

  return {
    ...base,
    curse,
    curseStrong: shadeHex(curse, -0.3),
    curseHitBorder: shadeHex(curse, 0.3),
  };
}

const CSS_VARS: Record<Exclude<keyof Theme, 'scheme'>, string> = {
  bg: '--bg',
  bg2: '--bg-2',
  card: '--card',
  card2: '--card-2',
  border: '--border',
  text: '--text',
  muted: '--muted',
  accent: '--accent',
  accent2: '--accent-2',
  success: '--success',
  failure: '--failure',
  danger: '--danger',
  headerBg: '--header-bg',
  barBg: '--bar-bg',
  scrim: '--scrim',
  divider: '--divider',
  dividerStrong: '--divider-strong',
  onAccent: '--on-accent',
  successText: '--success-text',
  failureText: '--failure-text',
  dangerText: '--danger-text',
  failureBright: '--failure-bright',
  failureTerminal: '--failure-terminal',
  curse: '--curse',
  curseStrong: '--curse-strong',
  curseHitBorder: '--curse-hit-border',
  curseText: '--curse-text',
  wickedText: '--wicked-text',
  cruelText: '--cruel-text',
};

/** Write the theme onto <html> so every CSS var reference picks it up. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VARS)) {
    root.style.setProperty(cssVar, theme[key as keyof typeof CSS_VARS]);
  }
  root.style.colorScheme = theme.scheme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme.accent2);
}
