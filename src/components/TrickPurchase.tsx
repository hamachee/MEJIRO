import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRollStore, effectiveTotals } from '../store/rollStore';
import { useSettingsStore } from '../store/settingsStore';
import { validatePurchase } from '../engine/tricks';
import { postTricks } from '../engine/discord';
import type { Character } from '../types/character';
import { Stepper } from './Stepper';
import { TrickInfo } from './TrickInfo';
import { FieldLabel } from './FieldLabel';

type PostState = 'idle' | 'posting' | 'done' | 'error';

const SEVERITIES = [0, 1, 2, 3] as const;
const SEVERITY_KEYS = ['none', 'minor', 'moderate', 'major'] as const;

interface Props {
  character: Character;
}

export function TrickPurchase({ character }: Props) {
  const { t } = useTranslation();
  const result = useRollStore((s) => s.result);
  const selectedTrickIds = useRollStore((s) => s.selectedTrickIds);
  const toggleTrick = useRollStore((s) => s.toggleTrick);
  const enhancement = useRollStore((s) => s.enhancement);
  const setEnhancement = useRollStore((s) => s.setEnhancement);
  const severity = useRollStore((s) => s.complicationSeverity);
  const setSeverity = useRollStore((s) => s.setComplicationSeverity);
  const settings = useSettingsStore((s) => s.settings);

  const [postState, setPostState] = useState<PostState>('idle');
  const [error, setError] = useState('');

  if (!result) return null;

  const { budget } = effectiveTotals(result, enhancement);
  const tricks = character.tricks;
  const selected = tricks.filter((tr) => selectedTrickIds.includes(tr.id));
  // Buying off the complication spends extra hits like any other purchase.
  // Overspending is allowed on purpose (a forgotten difficulty is fixable at
  // the table); the remaining count just goes red and negative.
  const purchases = severity > 0 ? [...selected, { cost: severity }] : selected;
  const { totalCost, remaining, valid } = validatePurchase(purchases, budget);

  const onPost = async () => {
    const url = character.webhookUrl.trim();
    if (!url) {
      setPostState('error');
      setError(t('result.noWebhook'));
      return;
    }
    setPostState('posting');
    try {
      await postTricks(
        {
          tricks: selected,
          budget,
          enhancement,
          complication: severity > 0 ? severity : undefined,
        },
        {
          webhookUrl: url,
          lang: settings.discordLang,
          characterName: character.showNameInWebhook ? character.name : '',
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

      {tricks.length === 0 ? (
        <p className="muted">{t('tricks.none')}</p>
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
                    {t('tricks.cost')} {tr.cost}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

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
    </section>
  );
}
