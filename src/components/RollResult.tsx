import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRollStore } from '../store/rollStore';
import { useCharacterStore } from '../store/characterStore';
import { useSettingsStore } from '../store/settingsStore';
import { postRollResult } from '../engine/discord';
import type { SystemTemplate } from '../types/template';

type PostState = 'idle' | 'posting' | 'done' | 'error';

interface Props {
  template: SystemTemplate;
}

export function RollResult({ template }: Props) {
  const { t } = useTranslation();
  const result = useRollStore((s) => s.result);
  const request = useRollStore((s) => s.request);
  const character = useCharacterStore((s) => s.active);
  const settings = useSettingsStore((s) => s.settings);
  const activeWebhookUrl = useSettingsStore((s) => s.activeWebhookUrl);

  const [postState, setPostState] = useState<PostState>('idle');
  const [error, setError] = useState('');

  if (!result || !request || !character) return null;

  const outcome = result.botched
    ? { text: t('result.botch'), cls: 'botch' }
    : result.passed
      ? { text: t('result.success'), cls: 'success' }
      : { text: t('result.failure'), cls: 'failure' };

  const onPost = async () => {
    const url = activeWebhookUrl();
    if (!url) {
      setPostState('error');
      setError(t('result.noWebhook'));
      return;
    }
    setPostState('posting');
    try {
      await postRollResult(template, request, result, {
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

      <div className="form-row">
        <button
          className="primary"
          onClick={onPost}
          disabled={postState === 'posting'}
        >
          {t('result.postToDiscord')}
        </button>
        {postState === 'done' && (
          <span className="ok">{t('result.posted')}</span>
        )}
        {postState === 'error' && <span className="danger-text">{error}</span>}
      </div>
    </section>
  );
}
