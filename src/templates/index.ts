import type { Stat, SystemTemplate } from '../types/template';
import curseborne from './curseborne.json';

/** All bundled system templates, keyed by id. */
export const TEMPLATES: Record<string, SystemTemplate> = {
  [curseborne.id]: curseborne as SystemTemplate,
};

/** Templates as a list, for pickers. */
export const TEMPLATE_LIST: SystemTemplate[] = Object.values(TEMPLATES);

export function getTemplate(id: string): SystemTemplate | undefined {
  return TEMPLATES[id];
}

/** The default template used when creating a new character. */
export const DEFAULT_TEMPLATE_ID = curseborne.id;

const ATTRIBUTE_GROUPS = new WeakMap<SystemTemplate, Map<string, Stat[]>>();

/**
 * A template's attributes grouped by category id, computed once per template
 * and cached — templates are static, so render paths can reuse the grouping
 * instead of re-filtering the attribute list per category.
 */
export function attributesByCategory(template: SystemTemplate): Map<string, Stat[]> {
  let groups = ATTRIBUTE_GROUPS.get(template);
  if (!groups) {
    groups = new Map(template.categories.map((c) => [c.id, [] as Stat[]]));
    for (const attr of template.attributes) {
      if (attr.category !== undefined) groups.get(attr.category)?.push(attr);
    }
    ATTRIBUTE_GROUPS.set(template, groups);
  }
  return groups;
}
