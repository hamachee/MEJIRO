import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { useCampaignStore } from '../store/campaignStore';
import { useSettingsStore } from '../store/settingsStore';
import { exportAllData, importAllData, clearAllData } from '../storage/backup';
import { IconExport, IconImport, IconTrash } from './icons';

function backupFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `MEJIRO-backup.${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/**
 * Whole-app backup: every character, campaign, and setting in one JSON
 * file. Import always replaces everything rather than merging — a partial
 * merge across characters/campaigns/settings at once has no obvious right
 * answer, so this only ever offers the unambiguous option.
 */
export function BackupSection() {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const loadCharacters = useCharacterStore((s) => s.loadRoster);
  const clearActiveCharacter = useCharacterStore((s) => s.clearActive);
  const loadCampaigns = useCampaignStore((s) => s.loadRoster);
  const clearActiveCampaign = useCampaignStore((s) => s.clearActive);
  const loadSettings = useSettingsStore((s) => s.load);

  const onExport = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFilename();
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = await file.text();
      if (!confirm(t('settings.confirmBackupReplace'))) return;
      await importAllData(json);
      clearActiveCharacter();
      clearActiveCampaign();
      await Promise.all([loadCharacters(), loadCampaigns(), loadSettings()]);
    } catch (err) {
      alert(
        t('settings.backupImportError', {
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const onClear = async () => {
    if (!confirm(t('settings.confirmBackupClear'))) return;
    await clearAllData();
    clearActiveCharacter();
    clearActiveCampaign();
    await Promise.all([loadCharacters(), loadCampaigns()]);
  };

  return (
    <section className="card">
      <h2>{t('settings.backup')}</h2>
      <p className="muted hint">{t('settings.backupHint')}</p>
      <div className="form-row">
        <button onClick={onExport}>
          <IconExport /> {t('settings.backupExport')}
        </button>
        <button onClick={() => fileInput.current?.click()}>
          <IconImport /> {t('settings.backupImport')}
        </button>
        <button className="danger" onClick={onClear}>
          <IconTrash /> {t('settings.backupClear')}
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={onFile}
      />
    </section>
  );
}
