import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import type { Campaign } from '../types/campaign';

export function CampaignList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const roster = useCampaignStore((s) => s.roster);
  const create = useCampaignStore((s) => s.create);
  const remove = useCampaignStore((s) => s.remove);

  const [name, setName] = useState('');

  const onCreate = async () => {
    const campaign = await create(name);
    setName('');
    navigate(`/gm/${campaign.id}`);
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
