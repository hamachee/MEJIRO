import { useTranslation } from 'react-i18next';

const FAQ_KEYS = ['storage', 'cache', 'clearData', 'backup', 'webhook'] as const;

export function Info() {
  const { t } = useTranslation();

  return (
    <div className="stack">
      <section className="card">
        <h1>{t('info.title')}</h1>
        <p className="muted hint">{t('info.intro')}</p>
      </section>

      {FAQ_KEYS.map((key) => (
        <details key={key} className="card fold-card" open>
          <summary className="card-summary">{t(`info.${key}.q`)}</summary>
          <p>{t(`info.${key}.a`)}</p>
        </details>
      ))}
    </div>
  );
}
