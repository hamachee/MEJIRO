import { useTranslation } from 'react-i18next';
import { useRollStore } from '../store/rollStore';

export function RollResult() {
  const { t } = useTranslation();
  const result = useRollStore((s) => s.result);
  const postStatus = useRollStore((s) => s.postStatus);
  const postError = useRollStore((s) => s.postError);

  if (!result) return null;

  const outcome = result.botched
    ? { text: t('result.botch'), cls: 'botch' }
    : result.passed
      ? { text: t('result.success'), cls: 'success' }
      : { text: t('result.failure'), cls: 'failure' };

  return (
    <section className="card result">
      <div className="result-head">
        <h2>{t('result.title')}</h2>
        <span className={`badge ${outcome.cls}`}>{outcome.text}</span>
      </div>

      <div className="dice-tray">
        {result.dice.map((d, i) => (
          <span
            key={i}
            className={`die ${d.successes > 0 ? 'hit' : ''} ${
              d.exploded ? 'exploded' : ''
            } ${d.isCurse ? 'curse' : ''}`}
            title={d.isCurse ? t('roller.curseDice') : undefined}
          >
            {d.value}
          </span>
        ))}
      </div>

      <div className="result-stats">
        <div>
          <span className="muted">{t('result.successes')}</span>
          <strong>{result.totalSuccesses}</strong>
          <span className="muted"> / {result.difficulty}</span>
        </div>
        <div>
          <span className="muted">{t('result.threshold')}</span>
          <strong>{result.thresholdSuccesses}</strong>
        </div>
      </div>

      {/* Rolls post to Discord automatically; this reports how that went. */}
      <div className="post-status">
        {postStatus === 'posting' && (
          <span className="muted">{t('result.posting')}</span>
        )}
        {postStatus === 'posted' && (
          <span className="ok">{t('result.posted')}</span>
        )}
        {postStatus === 'noWebhook' && (
          <span className="danger-text">⚠ {t('result.noWebhook')}</span>
        )}
        {postStatus === 'error' && (
          <span className="danger-text">
            ⚠ {t('result.postError', { message: postError })}
          </span>
        )}
      </div>
    </section>
  );
}
