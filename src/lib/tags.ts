/** Parse a comma-separated input into trimmed, non-empty tags. */
export function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
