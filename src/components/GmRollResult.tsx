import { useTranslation } from 'react-i18next';
import { useGmRollStore } from '../store/gmRollStore';
import { hasCurseHit } from '../engine/roll';
import type { Campaign } from '../types/campaign';

interface Props {
  campaign: Campaign;
}

export function GmRollResult({ campaign }: Props) {
  const { t } = useTranslation();
  const result = useGmRollStore((s) => s.result);
  const instanceLabel = useGmRollStore((s) => s.instanceLabel);
  const poolLabel = useGmRollStore((s) => s.poolLabel);
  const postStatus = useGmRollStore((s) => s.postStatus);
  const postError = useGmRollStore((s) => s.postError);
  const postToDiscord = useGmRollStore((s) => s.postToDiscord);

  if (!result) return null;

  const curseHit = hasCurseHit(result);
  const outcome = result.botched
    ? { text: t('result.botch'), cls: 'botch' }
    : result.passed
      ? curseHit
        ? { text: t('result.wicked'), cls: 'wicked' }
        : { text: t('result.success'), cls: 'success' }
      : curseHit
        ? { text: t('result.cruel'), cls: 'cruel' }
        : { text: t('result.failure'), cls: 'failure' };

  const hasWebhook = campaign.webhookUrl.trim().length > 0;

  return (
    <section className="card result">
      <div className="result-head">
        <h2>
          {instanceLabel} — {poolLabel}
        </h2>
        <span className={`badge ${outcome.cls}`}>{outcome.text}</span>
      </div>

      <div className="dice-tray">
        {result.dice.map((d, i) => (
          <span key={i} className={`die d10 ${d.successes > 0 ? 'hit' : ''}`}>
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
      </div>

      <div className="post-status">
        {campaign.autoPostToDiscord ? (
          <>
            {postStatus === 'posting' && <span className="muted">{t('result.posting')}</span>}
            {postStatus === 'posted' && <span className="ok">{t('result.posted')}</span>}
            {postStatus === 'error' && (
              <span className="danger-text">⚠ {t('result.postError', { message: postError })}</span>
            )}
          </>
        ) : (
          <>
            <button disabled={!hasWebhook || postStatus === 'posting'} onClick={() => postToDiscord(campaign)}>
              📤 {t('gm.postToDiscord')}
            </button>
            {!hasWebhook && <span className="muted"> {t('gm.noWebhook')}</span>}
            {postStatus === 'posted' && <span className="ok"> {t('result.posted')}</span>}
            {postStatus === 'error' && (
              <span className="danger-text"> ⚠ {t('result.postError', { message: postError })}</span>
            )}
          </>
        )}
      </div>
    </section>
  );
}
