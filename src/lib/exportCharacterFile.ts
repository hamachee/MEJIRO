import { exportCharacter } from '../storage/characters';
import { getTemplate } from '../templates';
import { label } from './localize';
import type { Character } from '../types/character';

/** Make a string safe to use as one dot-separated part of a filename. */
function filenamePart(s: string): string {
  return s.trim().replace(/[\\/:*?"<>|]+/g, '_') || 'unknown';
}

/** Download a character as a MEJIRO.<system>.<name>.json file. */
export function exportCharacterFile(character: Character, lang: string): void {
  const blob = new Blob([exportCharacter(character)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const tpl = getTemplate(character.templateId);
  const system = filenamePart(tpl ? label(tpl.name, lang) : character.templateId);
  const charName = filenamePart(character.name);
  a.download = `MEJIRO.${system}.${charName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
