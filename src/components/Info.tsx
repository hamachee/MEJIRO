import { useTranslation } from 'react-i18next';

const FAQ_KEYS = ['storage', 'cache', 'clearData', 'backup', 'webhook'] as const;

export function Info() {
  const { t } = useTranslation();

  return (
    <div className="stack">
      <section className="card">
        <h1>{t('info.title')}</h1>
        <p className="muted hint">{t('info.intro')}</p>
        {FAQ_KEYS.map((key) => (
          <div key={key}>
            <h2>{t(`info.${key}.q`)}</h2>
            <p>{t(`info.${key}.a`)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
