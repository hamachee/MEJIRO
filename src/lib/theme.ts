/**
 * Color scheme system. Six modes:
 *  - system: follows the OS/browser's prefers-color-scheme
 *  - dark / light: neutral built-in schemes
 *  - curseborne: the app's original violet scheme, fixed — not derived from
 *    whatever character/campaign happens to be open. MEJIRO only ever
 *    bundles the one game system, so there's nothing for this mode to vary
 *    by; it's just a named palette, same as dark/light.
 *  - newspaper / pineapple: additional fixed palettes, light-based like the
 *    neutral light scheme but built around a small given set of accent
 *    colors instead of the app's own purple.
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

export type ThemeMode =
  | 'system'
  | 'dark'
  | 'light'
  | 'curseborne'
  | 'newspaper'
  | 'pineapple';

export const THEME_MODES: ThemeMode[] = [
  'system',
  'dark',
  'light',
  'curseborne',
  'newspaper',
  'pineapple',
];

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

/**
 * A resolved theme adds text-contrast tokens computed at resolve time from
 * whichever danger/failure/curseStrong ended up active — including a
 * curse-color override, which can be any hex a user picks. Those three
 * backgrounds previously borrowed `onAccent` (chosen for contrast against
 * `accent`/`accent2`, an unrelated color), which silently broke legibility
 * whenever a theme's or override's own color had different lightness than
 * the accent it was borrowing text from. Deriving instead of hand-picking
 * means a new palette (or any curse-color override) gets correct contrast
 * for free, with no per-theme bookkeeping.
 */
export interface ResolvedTheme extends Theme {
  onDanger: string;
  onFailure: string;
  onCurseStrong: string;
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

/**
 * Newsprint — light base, but every accent (buttons, badges, curse dice)
 * stays within the four grays supplied for the theme rather than reaching
 * for hue: 252525 (ink), 545454, 7d7d7d, cfcfcf (paper shadow). The extra
 * in-between shades below (454545, 6a6a6a, 3a3a3a, 2f2f2f, 5a5a5a) are
 * hand-picked mixes of those four, not new hues — every value here has
 * R = G = B.
 */
export const NEWSPAPER_THEME: Theme = {
  scheme: 'light',
  bg: '#f7f7f7',
  bg2: '#ececec',
  card: '#ffffff',
  card2: '#f0f0f0',
  border: '#cfcfcf',
  text: '#252525',
  muted: '#7d7d7d',
  accent: '#252525',
  accent2: '#545454',
  success: '#545454',
  failure: '#7d7d7d',
  danger: '#252525',
  curse: '#545454',
  headerBg: 'rgba(255, 255, 255, 0.9)',
  barBg: 'rgba(240, 240, 240, 0.95)',
  scrim: 'rgba(37, 37, 37, 0.45)',
  divider: 'rgba(0, 0, 0, 0.08)',
  dividerStrong: 'rgba(0, 0, 0, 0.12)',
  onAccent: '#ffffff',
  successText: '#454545',
  failureText: '#6a6a6a',
  dangerText: '#252525',
  failureBright: '#5a5a5a',
  failureTerminal: '#2f2f2f',
  curseStrong: '#3a3a3a',
  curseHitBorder: '#7d7d7d',
  curseText: '#454545',
  wickedText: '#3a3a3a',
  cruelText: '#6a6a6a',
};

/**
 * Pineapple — light base, warmed toward cream/gold, with the given yellows
 * and greens carrying every accent (FFD500/FDC500 for the bright highlights,
 * 3A7D44/1E4F2A/01200F for success/failure/danger). Bright yellow reads
 * poorly as text on white, so `onAccent` and the curse text/strength shades
 * lean on the darker greens instead of the usual white-on-accent pattern.
 */
export const PINEAPPLE_THEME: Theme = {
  scheme: 'light',
  bg: '#fffdf5',
  bg2: '#fff6dc',
  card: '#ffffff',
  card2: '#fef6d8',
  border: '#e0d29a',
  text: '#01200f',
  muted: '#75816b',
  accent: '#ffd500',
  accent2: '#fdc500',
  success: '#3a7d44',
  failure: '#1e4f2a',
  danger: '#01200f',
  curse: '#ffd500',
  headerBg: 'rgba(255, 253, 245, 0.9)',
  barBg: 'rgba(255, 246, 220, 0.95)',
  scrim: 'rgba(30, 79, 42, 0.45)',
  divider: 'rgba(30, 79, 42, 0.08)',
  dividerStrong: 'rgba(30, 79, 42, 0.12)',
  onAccent: '#01200f',
  successText: '#2f6636',
  failureText: '#17381f',
  dangerText: '#01200f',
  failureBright: '#4f8f57',
  failureTerminal: '#0f2e18',
  curseStrong: '#fdc500',
  curseHitBorder: '#ffe066',
  curseText: '#8a6f00',
  wickedText: '#8a6f00',
  cruelText: '#2f6636',
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
 * Black or white, whichever reads better as text on `hex` — perceptual
 * luminance (ITU-R BT.601), not a full WCAG contrast-ratio computation, but
 * enough for a binary pick against an arbitrary background color.
 */
function readableTextOn(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance >= 0.5 ? '#000000' : '#ffffff';
}

/**
 * Resolve the theme to render. A valid `curseColor` overrides the curse die
 * and its derived hit/border shades on top of whichever base was picked —
 * it applies the same way in every mode, dark/light/curseborne/system alike.
 * `onDanger`/`onFailure`/`onCurseStrong` are then derived from whatever
 * danger/failure/curseStrong ended up active, so they're always correct
 * even for a curse color no theme author ever picked.
 */
export function resolveTheme(mode: ThemeMode, curseColor: string): ResolvedTheme {
  const base = (() => {
    switch (mode) {
      case 'light':
        return LIGHT_THEME;
      case 'curseborne':
        return CURSEBORNE_THEME;
      case 'newspaper':
        return NEWSPAPER_THEME;
      case 'pineapple':
        return PINEAPPLE_THEME;
      case 'system':
        return systemPrefersDark() ? DARK_THEME : LIGHT_THEME;
      case 'dark':
      default:
        return DARK_THEME;
    }
  })();

  const curseOverride = cssHex(curseColor);
  const curse = curseOverride ?? base.curse;
  const curseStrong = curseOverride ? shadeHex(curseOverride, -0.3) : base.curseStrong;
  const curseHitBorder = curseOverride ? shadeHex(curseOverride, 0.3) : base.curseHitBorder;

  return {
    ...base,
    curse,
    curseStrong,
    curseHitBorder,
    onDanger: readableTextOn(base.danger),
    onFailure: readableTextOn(base.failure),
    onCurseStrong: readableTextOn(curseStrong),
  };
}

const CSS_VARS: Record<Exclude<keyof ResolvedTheme, 'scheme'>, string> = {
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
  onDanger: '--on-danger',
  onFailure: '--on-failure',
  onCurseStrong: '--on-curse-strong',
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
export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VARS)) {
    root.style.setProperty(cssVar, theme[key as keyof typeof CSS_VARS]);
  }
  root.style.colorScheme = theme.scheme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme.accent2);
}
