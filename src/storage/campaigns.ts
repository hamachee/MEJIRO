import { getDB } from './db';
import { uid } from '../lib/uid';
import { blankAdversaryStats, type Campaign, type CampaignExport } from '../types/campaign';
import type { CharacterTrick } from '../types/character';

/** Create (but do not yet persist) a blank campaign. */
export function newCampaign(name: string, tricks: CharacterTrick[] = []): Campaign {
  const now = Date.now();
  return {
    id: uid(),
    name: name.trim() || 'Unnamed',
    webhookUrl: '',
    autoPostToDiscord: true,
    templates: [],
    instances: [],
    tricks,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Fill in any fields missing from campaigns saved by older app versions so
 * the rest of the app can rely on the current {@link Campaign} shape.
 */
export function normalizeCampaign(
  raw: Partial<Campaign> & Pick<Campaign, 'id' | 'name'>,
): Campaign {
  const now = Date.now();
  return {
    createdAt: now,
    updatedAt: now,
    ...raw,
    webhookUrl: raw.webhookUrl ?? '',
    autoPostToDiscord: raw.autoPostToDiscord ?? true,
    templates: (raw.templates ?? []).map((tpl) => ({
      ...tpl,
      stats: { ...blankAdversaryStats(), ...tpl.stats },
    })),
    instances: (raw.instances ?? []).map((i) => ({
      ...i,
      memo: i.memo ?? '',
      stats: { ...blankAdversaryStats(), ...i.stats },
      customPool: i.customPool ?? 0,
      conditions: i.conditions ?? [],
    })),
    tricks: raw.tricks ?? [],
  };
}

export async function listCampaigns(): Promise<Campaign[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('campaigns', 'by-updated');
  return all.reverse().map(normalizeCampaign); // newest first
}

export async function getCampaign(id: string): Promise<Campaign | undefined> {
  const db = await getDB();
  const raw = await db.get('campaigns', id);
  return raw ? normalizeCampaign(raw) : undefined;
}

export async function saveCampaign(campaign: Campaign): Promise<Campaign> {
  const db = await getDB();
  const toSave = { ...campaign, updatedAt: Date.now() };
  await db.put('campaigns', toSave);
  return toSave;
}

export async function deleteCampaign(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('campaigns', id);
}

/**
 * Serialise a campaign to a portable JSON envelope. The webhook URL is
 * stripped: it grants posting access to a Discord channel, so it must not
 * leak when a campaign is shared.
 */
export function exportCampaign(campaign: Campaign): string {
  const envelope: CampaignExport = {
    format: 'mejiro-campaign',
    version: 1,
    campaign: { ...campaign, webhookUrl: '' },
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Parse an exported campaign JSON. Assigns a fresh id so importing never
 * overwrites an existing campaign. Throws on an unrecognised format.
 */
export function parseCampaignImport(json: string): Campaign {
  const data = JSON.parse(json) as Partial<CampaignExport>;
  if (data.format !== 'mejiro-campaign' || !data.campaign) {
    throw new Error('Not a MEJIRO campaign file');
  }
  const now = Date.now();
  return normalizeCampaign({
    ...data.campaign,
    id: uid(),
    createdAt: now,
    updatedAt: now,
  });
}
