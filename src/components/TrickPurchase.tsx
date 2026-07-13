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
  const selectedTrickIds = useRollStore((s) => s.selectedTrickIds);
  const toggleTrick = useRollStore((s) => s.toggleTrick);
  const settings = useSettingsStore((s) => s.settings);
  const activeWebhookUrl = useSettingsStore((s) => s.activeWebhookUrl);

  const [postState, setPostState] = useState<PostState>('idle');
  const [error, setError] = useState('');

  if (!result) return null;

  const budget = result.thresholdSuccesses;
  const tricks = character.tricks;
  const selected = tricks.filter((tr) => selectedTrickIds.includes(tr.id));
  const { totalCost, remaining, valid } = validatePurchase(selected, budget);

  const onPost = async () => {
    const url = activeWebhookUrl();
    if (!url) {
      setPostState('error');
      setError(t('result.noWebhook'));
      return;
    }
    setPostState('posting');
    try {
      await postTricks(template, selected, budget, {
        webhookUrl: url,
        lang: settings.discordLang,
        characterName: character.name,
      });
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

      {tricks.length === 0 ? (
        <p className="muted">{t('tricks.none')}</p>
      ) : (
        <ul className="trick-list">
          {tricks.map((tr) => {
            const isSelected = selectedTrickIds.includes(tr.id);
            const affordable = isSelected || canAfford(selected, tr, budget);
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
          disabled={postState === 'posting' || selected.length === 0}
        >
          {t('tricks.postTricks')} ({totalCost})
        </button>
        {postState === 'done' && <span className="ok">{t('result.posted')}</span>}
        {postState === 'error' && <span className="danger-text">{error}</span>}
      </div>
    </section>
  );
}
