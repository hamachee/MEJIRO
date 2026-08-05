import { parseHexColor } from '../engine/discord';

/** Matches the engine's THEME_COLOR (0x5b4b8a) — used as the color picker's starting point when a field is empty. */
export const DEFAULT_EMBED_COLOR_HEX = '#5b4b8a';

/** A valid hex color string usable directly as a CSS color, or undefined if invalid/empty. */
export function cssHex(raw: string): string | undefined {
  return parseHexColor(raw) !== undefined ? `#${raw.trim().replace(/^#/, '')}` : undefined;
}

/** A value <input type="color"> will accept — raw's parsed hex, or a fallback when raw is empty/invalid. */
export function pickerValue(raw: string, fallback: string = DEFAULT_EMBED_COLOR_HEX): string {
  return cssHex(raw) ?? fallback;
}

/** Inline style putting `color` on an element's left border, or undefined to leave the element's normal border alone. */
export function leftBorderStyle(color: string | undefined): { borderLeftWidth: string; borderLeftColor: string } | undefined {
  return color ? { borderLeftWidth: '4px', borderLeftColor: color } : undefined;
}
