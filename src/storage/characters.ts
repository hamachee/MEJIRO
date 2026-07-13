import { getDB } from './db';
import type { Character, CharacterExport, ResourceState } from '../types/character';
import type { SystemTemplate } from '../types/template';

function uid(): string {
  return (
    crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

/** Build the initial resource states for a template. */
function initialResources(template: SystemTemplate): Record<string, ResourceState> {
  const out: Record<string, ResourceState> = {};
  for (const r of template.resources) {
    out[r.id] = { value: r.default, log: [] };
  }
  return out;
}

/** Create (but do not yet persist) a blank character for a template. */
export function newCharacter(template: SystemTemplate, name: string): Character {
  const now = Date.now();
  return {
    id: uid(),
    templateId: template.id,
    name: name.trim() || 'Unnamed',
    attributes: Object.fromEntries(template.attributes.map((a) => [a.id, 1])),
    skills: Object.fromEntries(template.skills.map((s) => [s.id, 0])),
    resources: initialResources(template),
    createdAt: now,
    updatedAt: now,
  };
}

export async function listCharacters(): Promise<Character[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('characters', 'by-updated');
  return all.reverse(); // newest first
}

export async function getCharacter(id: string): Promise<Character | undefined> {
  const db = await getDB();
  return db.get('characters', id);
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

/** Serialise a character to a portable JSON envelope. */
export function exportCharacter(character: Character): string {
  const envelope: CharacterExport = {
    format: 'mejiro-character',
    version: 1,
    character,
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
  return { ...data.character, id: uid(), createdAt: now, updatedAt: now };
}
