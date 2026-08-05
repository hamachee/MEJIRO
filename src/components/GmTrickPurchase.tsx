import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGmRollStore } from '../store/gmRollStore';
import { effectiveTotals } from '../store/rollStore';
import { useSettingsStore } from '../store/settingsStore';
import { validatePurchase } from '../engine/tricks';
import { postTricks } from '../engine/discord';
import { VARIABLE_COST_OPTIONS, formatTrickCost, resolveTrickCost } from '../lib/trickCost';
import type { Campaign } from '../types/campaign';
import { Stepper } from './Stepper';
import { TrickInfo } from './TrickInfo';
import { FieldLabel } from './FieldLabel';

type PostState = 'idle' | 'posting' | 'done' | 'error';

const SEVERITIES = [0, 1, 2, 3] as const;
const SEVERITY_KEYS = ['none', 'minor', 'moderate', 'major'] as const;

interface Props {
  campaign: Campaign;
}

/** Post-roll trick purchase phase for the GM page — mirrors TrickPurchase for characters. */
export function GmTrickPurchase({ campaign }: Props) {
  const { t } = useTranslation();
  const result = useGmRollStore((s) => s.result);
  const instanceLabel = useGmRollStore((s) => s.instanceLabel);
  const selectedTrickIds = useGmRollStore((s) => s.selectedTrickIds);
  const toggleTrick = useGmRollStore((s) => s.toggleTrick);
  const variableCosts = useGmRollStore((s) => s.variableCosts);
  const setVariableCost = useGmRollStore((s) => s.setVariableCost);
  const enhancement = useGmRollStore((s) => s.enhancement);
  const setEnhancement = useGmRollStore((s) => s.setEnhancement);
  const severity = useGmRollStore((s) => s.complicationSeverity);
  const setSeverity = useGmRollStore((s) => s.setComplicationSeverity);
  const settings = useSettingsStore((s) => s.settings);

  const [postState, setPostState] = useState<PostState>('idle');
  const [error, setError] = useState('');

  if (!result) return null;

  const { budget } = effectiveTotals(result, enhancement);
  const tricks = campaign.tricks;
  const selected = tricks.filter((tr) => selectedTrickIds.includes(tr.id));
  const resolved = selected.map((tr) => ({
    name: tr.name,
    cost: resolveTrickCost(tr, variableCosts),
  }));
  const purchases = severity > 0 ? [...resolved, { cost: severity }] : resolved;
  const { totalCost, remaining, valid } = validatePurchase(purchases, budget);

  const onPost = async () => {
    const url = campaign.webhookUrl.trim();
    if (!url) {
      setPostState('error');
      setError(t('gm.noWebhook'));
      return;
    }
    setPostState('posting');
    try {
      await postTricks(
        {
          tricks: resolved,
          budget,
          enhancement,
          complication: severity > 0 ? severity : undefined,
        },
        {
          webhookUrl: url,
          lang: settings.uiLang,
          characterName: instanceLabel,
          color: campaign.embedColor,
        },
      );
      setPostState('done');
    } catch (err) {
      setPostState('error');
      setError(
        t('result.postError', {
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  };

  const nothingToPost =
    selected.length === 0 && severity === 0 && enhancement === 0;

  return (
    <section className="card">
      <div className="result-head">
        <h2>
          <FieldLabel i18nKey="tricks.title" en="Tricks" />
        </h2>
        <span className={`badge ${valid ? '' : 'failure'}`}>
          {t('tricks.remaining')}: {remaining} / {budget}
        </span>
      </div>

      <div className="form-row">
        <Stepper
          label={<FieldLabel i18nKey="roller.enhancement" en="Enhancement" />}
          ariaLabel={t('roller.enhancement')}
          value={enhancement}
          onChange={setEnhancement}
        />
      </div>

      <div className="field">
        <span className="field-label">
          <FieldLabel i18nKey="tricks.complication" en="Complication" />
        </span>
        <div className="severity-row">
          {SEVERITIES.map((n) => (
            <button
              key={n}
              className={`severity ${severity === n ? 'active' : ''}`}
              onClick={() => setSeverity(n)}
            >
              {t(`tricks.severity.${SEVERITY_KEYS[n]}`)}
              {n > 0 && <span className="severity-cost">−{n}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="form-row">
        <button
          className="primary"
          onClick={onPost}
          disabled={postState === 'posting' || nothingToPost}
        >
          {t('tricks.postTricks')} ({totalCost})
        </button>
        {postState === 'done' && <span className="ok">{t('result.posted')}</span>}
        {postState === 'error' && <span className="danger-text">{error}</span>}
      </div>

      {tricks.length === 0 ? (
        <p className="muted">{t('gm.noTricks')}</p>
      ) : (
        <ul className="trick-list">
          {tricks.map((tr) => {
            const isSelected = selectedTrickIds.includes(tr.id);
            return (
              <li key={tr.id}>
                <label className="trick">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTrick(tr.id)}
                  />
                  <span className="trick-body">
                    <TrickInfo trick={tr} />
                  </span>
                  <span className="trick-cost">
                    {t('tricks.cost')}{' '}
                    {tr.cost === 'variable' && isSelected ? (
                      <select
                        className="variable-cost-select"
                        aria-label={`${tr.name} ${t('tricks.cost')}`}
                        value={variableCosts[tr.id] ?? 1}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setVariableCost(tr.id, Number(e.target.value))}
                      >
                        {VARIABLE_COST_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    ) : (
                      formatTrickCost(tr.cost)
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
