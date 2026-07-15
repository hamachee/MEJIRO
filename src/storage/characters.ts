import { getDB } from './db';
import { uid } from '../lib/uid';
import type {
  Character,
  CharacterExport,
  CharacterTrick,
  ResourceState,
} from '../types/character';
import type { SystemTemplate } from '../types/template';

/** Build the initial resource states for a template. */
function initialResources(template: SystemTemplate): Record<string, ResourceState> {
  const out: Record<string, ResourceState> = {};
  for (const r of template.resources) {
    out[r.id] = { value: r.default, log: [] };
  }
  return out;
}

/** Fallback injury box count when a template defines no injury track. */
const DEFAULT_INJURY_BOXES = 8;

/** Total injury boxes for a template (sum of its levels, or the fallback). */
export function injuryTotal(template: SystemTemplate): number {
  const levels = template.injuryTrack?.levels;
  return levels?.length
    ? levels.reduce((sum, l) => sum + l.boxes, 0)
    : DEFAULT_INJURY_BOXES;
}

/**
 * Seed tricks for a new character: generic hit-cost placeholders the user
 * renames or replaces with their own (names come from the UI language).
 */
export function defaultTricks(names: [string, string, string]): CharacterTrick[] {
  return names.map((name, i) => ({ id: uid(), name, cost: i + 1 }));
}

/** Create (but do not yet persist) a blank character for a template. */
export function newCharacter(
  template: SystemTemplate,
  name: string,
  tricks: CharacterTrick[] = [],
): Character {
  const now = Date.now();
  return {
    id: uid(),
    templateId: template.id,
    name: name.trim() || 'Unnamed',
    identity: { lineage: '', family: '', concept: '', entanglement: 0, rolePath: '', shortTerm1: '', shortTerm2: '', longTerm: '', motifs: '' },
    webhookUrl: '',
    showNameInWebhook: true,
    attributes: Object.fromEntries(template.attributes.map((a) => [a.id, 1])),
    skills: Object.fromEntries(template.skills.map((s) => [s.id, 0])),
    edges: [],
    paths: [],
    contacts: [],
    bonds: [],
    conditions: [],
    gear: [],
    spells: [],
    torment: '',
    damnation: '',
    tricks,
    injuries: { boxes: injuryTotal(template), marked: 0, takenOut: false },
    armor: { rating: 0, marked: 0 },
    curseDice: 1,
    resources: initialResources(template),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Fill in any fields missing from characters saved by older app versions
 * (or hand-edited import files) so the rest of the app can rely on the
 * current {@link Character} shape.
 */
export function normalizeCharacter(raw: Partial<Character> & Pick<Character, 'id' | 'templateId' | 'name'>): Character {
  const now = Date.now();
  return {
    attributes: {},
    skills: {},
    resources: {},
    createdAt: now,
    updatedAt: now,
    ...raw,
    identity: { ...{ lineage: '', family: '', concept: '', entanglement: 0, rolePath: '', shortTerm1: '', shortTerm2: '', longTerm: '', motifs: '' }, ...raw.identity },
    webhookUrl: raw.webhookUrl ?? '',
    showNameInWebhook: raw.showNameInWebhook ?? true,
    edges: raw.edges ?? [],
    paths: raw.paths ?? [],
    contacts: raw.contacts ?? [],
    bonds: raw.bonds ?? [],
    conditions: raw.conditions ?? [],
    gear: (raw.gear ?? []).map((g) => ({
      ...g,
      tags: g.tags ?? [],
      favorite: g.favorite ?? false,
    })),
    spells: (raw.spells ?? []).map((sp) => ({
      ...sp,
      attunements: sp.attunements ?? [],
      favorite: sp.favorite ?? false,
    })),
    torment: raw.torment ?? '',
    damnation: raw.damnation ?? '',
    tricks: raw.tricks ?? [],
    injuries: {
      boxes: DEFAULT_INJURY_BOXES,
      marked: 0,
      takenOut: false,
      ...raw.injuries,
    },
    armor: { rating: 0, marked: 0, ...raw.armor },
    curseDice: raw.curseDice ?? 1,
  };
}

export async function listCharacters(): Promise<Character[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('characters', 'by-updated');
  return all.reverse().map(normalizeCharacter); // newest first
}

export async function getCharacter(id: string): Promise<Character | undefined> {
  const db = await getDB();
  const raw = await db.get('characters', id);
  return raw ? normalizeCharacter(raw) : undefined;
}

export async function saveCharacter(character: Character): Promise<Character> {
  const db = await getDB();
  const toSave = { ...character, updatedAt: Date.now() };
  await db.put('characters', toSave);
  return toSave;
}

export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('characters', id);
}

/**
 * Serialise a character to a portable JSON envelope. The webhook URL is
 * stripped: it grants posting access to a Discord channel, so it must not
 * leak when a sheet is shared.
 */
export function exportCharacter(character: Character): string {
  const envelope: CharacterExport = {
    format: 'mejiro-character',
    version: 1,
    character: { ...character, webhookUrl: '' },
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parse an exported character JSON. Assigns a fresh id so importing never
 * overwrites an existing character. Throws on an unrecognised format.
 */
export function parseCharacterImport(json: string): Character {
  const data = JSON.parse(json) as Partial<CharacterExport>;
  if (data.format !== 'mejiro-character' || !data.character) {
    throw new Error('Not a MEJIRO character file');
  }
  const now = Date.now();
  return normalizeCharacter({
    ...data.character,
    id: uid(),
    createdAt: now,
    updatedAt: now,
  });
}
