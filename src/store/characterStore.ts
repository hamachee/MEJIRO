import { create } from 'zustand';
import type { Character, ResourceState } from '../types/character';
import type { SystemTemplate } from '../types/template';
import {
  deleteCharacter,
  getCharacter,
  listCharacters,
  newCharacter,
  parseCharacterImport,
  saveCharacter,
} from '../storage/characters';

interface CharacterStoreState {
  roster: Character[];
  active: Character | null;
  loadRoster: () => Promise<void>;
  create: (template: SystemTemplate, name: string) => Promise<Character>;
  open: (id: string) => Promise<Character | undefined>;
  clearActive: () => void;
  rename: (name: string) => void;
  adjustStat: (
    kind: 'attributes' | 'skills',
    id: string,
    delta: number,
  ) => void;
  applyResourceDelta: (resourceId: string, delta: number, max?: number) => void;
  undoResource: (resourceId: string) => void;
  remove: (id: string) => Promise<void>;
  importFromJson: (json: string) => Promise<Character>;
}

/**
 * Apply a mutation to the active character. State is updated synchronously
 * (optimistic) so rapid successive edits never read stale values; the write to
 * IndexedDB happens in the background. This is safe for a single-user,
 * single-tab local app — the store is the source of truth while open.
 */
function commit(
  set: (partial: Partial<CharacterStoreState>) => void,
  get: () => CharacterStoreState,
  next: Character,
) {
  const updated = { ...next, updatedAt: Date.now() };
  set({
    active: updated,
    roster: [updated, ...get().roster.filter((c) => c.id !== updated.id)],
  });
  void saveCharacter(updated).catch((err) =>
    console.error('Failed to save character', err),
  );
}

export const useCharacterStore = create<CharacterStoreState>((set, get) => ({
  roster: [],
  active: null,

  loadRoster: async () => {
    set({ roster: await listCharacters() });
  },

  create: async (template, name) => {
    const character = await saveCharacter(newCharacter(template, name));
    set({ roster: [character, ...get().roster], active: character });
    return character;
  },

  open: async (id) => {
    const character = await getCharacter(id);
    set({ active: character ?? null });
    return character;
  },

  clearActive: () => set({ active: null }),

  rename: (name) => {
    const active = get().active;
    if (!active) return;
    commit(set, get, { ...active, name: name.trim() || active.name });
  },

  adjustStat: (kind, id, delta) => {
    const active = get().active;
    if (!active) return;
    const current = active[kind][id] ?? 0;
    const value = Math.max(0, current + delta);
    if (value === current) return;
    commit(set, get, {
      ...active,
      [kind]: { ...active[kind], [id]: value },
    });
  },

  applyResourceDelta: (resourceId, delta, max) => {
    const active = get().active;
    if (!active) return;
    const current: ResourceState =
      active.resources[resourceId] ?? { value: 0, log: [] };
    let nextValue = current.value + delta;
    nextValue = Math.max(0, nextValue);
    if (max !== undefined) nextValue = Math.min(max, nextValue);
    const applied = nextValue - current.value;
    if (applied === 0) return;
    const nextState: ResourceState = {
      value: nextValue,
      log: [...current.log, { delta: applied, after: nextValue, at: Date.now() }],
    };
    commit(set, get, {
      ...active,
      resources: { ...active.resources, [resourceId]: nextState },
    });
  },

  undoResource: (resourceId) => {
    const active = get().active;
    if (!active) return;
    const current = active.resources[resourceId];
    if (!current || current.log.length === 0) return;
    const log = current.log.slice(0, -1);
    const last = log[log.length - 1];
    const value = last ? last.after : valueBeforeFirst(current);
    commit(set, get, {
      ...active,
      resources: { ...active.resources, [resourceId]: { value, log } },
    });
  },

  remove: async (id) => {
    await deleteCharacter(id);
    const active = get().active;
    set({
      roster: get().roster.filter((c) => c.id !== id),
      active: active?.id === id ? null : active,
    });
  },

  importFromJson: async (json) => {
    const character = await saveCharacter(parseCharacterImport(json));
    set({ roster: [character, ...get().roster] });
    return character;
  },
}));

/** Reconstruct a resource's value before its first logged change. */
function valueBeforeFirst(state: ResourceState): number {
  const first = state.log[0];
  return first ? first.after - first.delta : state.value;
}
