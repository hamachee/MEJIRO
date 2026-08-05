/**
 * Parse a hex color like "#5B4B8A" or "5b4b8a" (3- or 6-digit) into a
 * Discord embed color integer. Returns undefined for empty/invalid input,
 * so callers can fall back to their own default with `??`.
 */
export function parseHexColor(hex: string | undefined): number | undefined {
  const stripped = hex?.trim().replace(/^#/, '');
  if (!stripped) return undefined;
  if (/^[0-9a-fA-F]{3}$/.test(stripped)) {
    return parseInt(
      stripped
        .split('')
        .map((c) => c + c)
        .join(''),
      16,
    );
  }
  if (/^[0-9a-fA-F]{6}$/.test(stripped)) return parseInt(stripped, 16);
  return undefined;
}

/** A valid hex color string usable directly as a CSS color, or undefined if invalid/empty. */
export function cssHex(raw: string): string | undefined {
  return parseHexColor(raw) !== undefined ? `#${raw.trim().replace(/^#/, '')}` : undefined;
}

/**
 * A value <input type="color"> will accept — raw's parsed hex, or `fallback`
 * when raw is empty/invalid. `fallback` is required (no baked-in default
 * hue): callers should pass a value the picker can honestly show as its
 * "nothing set" state — e.g. the surrounding card's own background, so the
 * swatch blends in rather than implying a color was already chosen.
 */
export function pickerValue(raw: string, fallback: string): string {
  return cssHex(raw) ?? fallback;
}

/** Inline style putting `color` on an element's left border, or undefined to leave the element's normal border alone. */
export function leftBorderStyle(color: string | undefined): { borderLeftWidth: string; borderLeftColor: string } | undefined {
  return color ? { borderLeftWidth: '4px', borderLeftColor: color } : undefined;
}
