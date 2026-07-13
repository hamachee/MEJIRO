import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRollStore } from '../store/rollStore';
import { useSettingsStore } from '../store/settingsStore';
import { validatePurchase, canAfford } from '../engine/tricks';
import { postTricks } from '../engine/discord';
import type { Character } from '../types/character';
import type { SystemTemplate } from '../types/template';

type PostState = 'idle' | 'posting' | 'done' | 'error';

interface Props {
  character: Character;
  template: SystemTemplate;
}

export function TrickPurchase({ character, template }: Props) {
  const { t } = useTranslation();
  const result = useRollStore((s) => s.result);
  const request = useRollStore((s) => s.request);
  const selectedTrickIds = useRollStore((s) => s.selectedTrickIds);
  const toggleTrick = useRollStore((s) => s.toggleTrick);
  const resolveComplication = useRollStore((s) => s.resolveComplication);
  const toggleResolveComplication = useRollStore((s) => s.toggleResolveComplication);
  const settings = useSettingsStore((s) => s.settings);

  const [postState, setPostState] = useState<PostState>('idle');
  const [error, setError] = useState('');

  if (!result) return null;

  const budget = result.thresholdSuccesses;
  const complication = request?.complication ?? 0;
  const tricks = character.tricks;
  const selected = tricks.filter((tr) => selectedTrickIds.includes(tr.id));
  // Resolving the complication spends extra hits like any other purchase.
  const purchases = resolveComplication
    ? [...selected, { cost: complication }]
    : selected;
  const { totalCost, remaining, valid } = validatePurchase(purchases, budget);
  const canResolve =
    resolveComplication || canAfford(purchases, { cost: complication }, budget);

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
        template,
        selected,
        budget,
        complication > 0
          ? { rating: complication, resolved: resolveComplication }
          : undefined,
        {
          webhookUrl: url,
          lang: settings.discordLang,
          characterName: character.name,
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

  return (
    <section className="card">
      <div className="result-head">
        <h2>{t('tricks.title')}</h2>
        <span className={`badge ${valid ? '' : 'failure'}`}>
          {t('tricks.remaining')}: {remaining} / {budget}
        </span>
      </div>

      {complication > 0 && (
        <label className={`trick complication ${canResolve ? '' : 'disabled'}`}>
          <input
            type="checkbox"
            checked={resolveComplication}
            disabled={!canResolve}
            onChange={toggleResolveComplication}
          />
          <span className="trick-body">
            <span className="trick-name">
              {t('tricks.resolveComplication', { n: complication })}
            </span>
            <span className="muted trick-desc">
              {resolveComplication
                ? t('tricks.complicationResolved')
                : t('tricks.consequence')}
            </span>
          </span>
          <span className="trick-cost">
            {t('tricks.cost')} {complication}
          </span>
        </label>
      )}

      {tricks.length === 0 ? (
        <p className="muted">{t('tricks.none')}</p>
      ) : (
        <ul className="trick-list">
          {tricks.map((tr) => {
            const isSelected = selectedTrickIds.includes(tr.id);
            const affordable = isSelected || canAfford(purchases, tr, budget);
            return (
              <li key={tr.id}>
                <label className={`trick ${affordable ? '' : 'disabled'}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!affordable}
                    onChange={() => toggleTrick(tr.id, affordable)}
                  />
                  <span className="trick-body">
                    <span className="trick-name">{tr.name}</span>
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
          disabled={
            postState === 'posting' ||
            (selected.length === 0 && complication === 0)
          }
        >
          {t('tricks.postTricks')} ({totalCost})
        </button>
        {postState === 'done' && <span className="ok">{t('result.posted')}</span>}
        {postState === 'error' && <span className="danger-text">{error}</span>}
      </div>
    </section>
  );
}
