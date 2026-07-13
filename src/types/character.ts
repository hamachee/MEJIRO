/** A single change applied to a resource, kept so it can be undone. */
export interface ResourceChange {
  /** Signed delta applied (e.g. -3 for damage). */
  delta: number;
  /** Value after the change was applied. */
  after: number;
  /** Epoch ms when the change happened. */
  at: number;
}

/** A tracked resource's live value plus its change log for undo. */
export interface ResourceState {
  value: number;
  log: ResourceChange[];
}

/**
 * A character sheet. `attributes` and `skills` map stat id -> dots/rating.
 * `resources` maps resource id -> its live state. All storage is local
 * (IndexedDB); nothing leaves the browser unless exported.
 */
export interface Character {
  id: string;
  templateId: string;
  name: string;
  attributes: Record<string, number>;
  skills: Record<string, number>;
  resources: Record<string, ResourceState>;
  createdAt: number;
  updatedAt: number;
}

/** Envelope used for JSON export/import so files are self-describing. */
export interface CharacterExport {
  format: 'mejiro-character';
  version: 1;
  character: Character;
}
