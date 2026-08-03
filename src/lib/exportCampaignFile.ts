import { exportCampaign } from '../storage/campaigns';
import type { Campaign } from '../types/campaign';

/** Make a string safe to use as one dot-separated part of a filename. */
function filenamePart(s: string): string {
  return s.trim().replace(/[\\/:*?"<>|]+/g, '_') || 'unknown';
}

/** Download a campaign as a MEJIRO.GM.<name>.json file. */
export function exportCampaignFile(campaign: Campaign): void {
  const blob = new Blob([exportCampaign(campaign)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MEJIRO.GM.${filenamePart(campaign.name)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
