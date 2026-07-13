import type { SystemTemplate } from '../types/template';
import storypathUltra from './storypath-ultra.json';

/** All bundled system templates, keyed by id. */
export const TEMPLATES: Record<string, SystemTemplate> = {
  [storypathUltra.id]: storypathUltra as SystemTemplate,
};

/** Templates as a list, for pickers. */
export const TEMPLATE_LIST: SystemTemplate[] = Object.values(TEMPLATES);

export function getTemplate(id: string): SystemTemplate | undefined {
  return TEMPLATES[id];
}

/** The default template used when creating a new character. */
export const DEFAULT_TEMPLATE_ID = storypathUltra.id;
