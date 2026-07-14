/** Generate a short unique id for locally-created records (characters, tricks, gear...). */
export function uid(): string {
  return (
    crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}
