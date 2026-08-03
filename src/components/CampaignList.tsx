import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { defaultTricks } from '../storage/characters';
import { exportCampaignFile } from '../lib/exportCampaignFile';
import type { Campaign } from '../types/campaign';

export function CampaignList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const roster = useCampaignStore((s) => s.roster);
  const create = useCampaignStore((s) => s.create);
  const remove = useCampaignStore((s) => s.remove);
  const importFromJson = useCampaignStore((s) => s.importFromJson);

  const [name, setName] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const onCreate = async () => {
    const campaign = await create(
      name,
      defaultTricks([
        t('tricks.defaultOne'),
        t('tricks.defaultTwo'),
        t('tricks.defaultThree'),
      ]),
    );
    setName('');
    navigate(`/gm/${campaign.id}`);
  };

  const onExport = (campaign: Campaign) => exportCampaignFile(campaign);

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importFromJson(text);
    } catch (err) {
      alert(
        t('characters.importError', {
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const onDelete = async (campaign: Campaign) => {
    if (confirm(t('gm.confirmDelete'))) await remove(campaign.id);
  };

  return (
    <div className="stack">
      <section className="card">
        <h1>{t('gm.new')}</h1>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('gm.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          />
          <button className="primary" onClick={onCreate}>
            {t('gm.create')}
          </button>
        </div>
        <div className="form-row">
          <button onClick={() => fileInput.current?.click()}>
            {t('characters.import')}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onImportFile}
          />
        </div>
      </section>

      <section className="card">
        <h2>{t('gm.title')}</h2>
        {roster.length === 0 ? (
          <p className="muted">{t('gm.empty')}</p>
        ) : (
          <ul className="roster">
            {roster.map((c) => (
              <li key={c.id} className="roster-item">
                <button className="roster-open" onClick={() => navigate(`/gm/${c.id}`)}>
                  <strong>{c.name}</strong>
                </button>
                <div className="roster-actions">
                  <button onClick={() => onExport(c)}>
                    {t('characters.export')}
                  </button>
                  <button className="danger" onClick={() => onDelete(c)}>
                    {t('characters.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
