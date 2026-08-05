import { parseHexColor } from '../engine/discord';

/** A valid hex color string usable directly as a CSS color, or undefined if invalid/empty. */
export function cssHex(raw: string): string | undefined {
  return parseHexColor(raw) !== undefined ? `#${raw.trim().replace(/^#/, '')}` : undefined;
}
