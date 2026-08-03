import { useTranslation } from 'react-i18next';
import { useCampaignStore } from '../store/campaignStore';
import { useGmRollStore } from '../store/gmRollStore';
import { desperationPool, type Campaign } from '../types/campaign';
import { Stepper } from './Stepper';
import { IconDice } from './icons';

const BONUS_DICE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Props {
  campaign: Campaign;
}

/** Sticky bar at the bottom of the GM page: rolls whichever pool was tapped on a card. */
export function GmRollBar({ campaign }: Props) {
  const { t } = useTranslation();
  const patch = useCampaignStore((s) => s.patch);

  const selectedInstanceId = useGmRollStore((s) => s.selectedInstanceId);
  const selectedPool = useGmRollStore((s) => s.selectedPool);
  const bonusDice = useGmRollStore((s) => s.bonusDice);
  const setBonusDice = useGmRollStore((s) => s.setBonusDice);
  const difficulty = useGmRollStore((s) => s.difficulty);
  const setDifficulty = useGmRollStore((s) => s.setDifficulty);
  const performRoll = useGmRollStore((s) => s.performRoll);

  const instance = campaign.instances.find((i) => i.id === selectedInstanceId);

  const poolLabel = selectedPool
    ? {
        primary: t('gm.primaryPool'),
        secondary: t('gm.secondaryPool'),
        desperation: t('gm.desperationPool'),
        custom: t('gm.customPool'),
      }[selectedPool]
    : null;

  const poolRating =
    selectedPool === 'custom'
      ? campaign.customPool
      : instance && selectedPool
        ? selectedPool === 'primary'
          ? instance.stats.primaryPool
          : selectedPool === 'secondary'
            ? instance.stats.secondaryPool
            : desperationPool(instance.stats.primaryPool)
        : 0;

  const pool = poolRating + bonusDice;
  const canRoll = selectedPool === 'custom' ? poolRating > 0 : Boolean(instance && poolRating > 0);

  return (
    <div className="roll-bar">
      <div className="roll-bar-pool">
        <strong className="roll-bar-total">{pool}</strong>
        <div className="roll-bar-parts">
          <span className="roll-bar-pick muted">
            {instance
              ? `${instance.label} — ${poolLabel}`
              : selectedPool === 'custom'
                ? poolLabel
                : t('gm.pickAPool')}
          </span>
          {(instance || selectedPool === 'custom') && <span className="roll-bar-rating">{poolRating}</span>}
          <span className="roll-bar-plus muted">+</span>
          <select
            className="roll-bar-pick roll-bar-bonus"
            aria-label={t('roller.bonusDice')}
            title={t('roller.bonusDice')}
            value={bonusDice}
            onChange={(e) => setBonusDice(Number(e.target.value))}
          >
            {BONUS_DICE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="roll-bar-controls">
        <label className="field-check">
          <input
            type="checkbox"
            checked={campaign.autoPostToDiscord}
            onChange={(e) => patch({ autoPostToDiscord: e.target.checked })}
          />
          <span>{t('gm.autoPostToDiscord')}</span>
        </label>
        <Stepper
          label={t('roller.difficulty')}
          ariaLabel={t('roller.difficulty')}
          value={difficulty}
          onChange={setDifficulty}
        />
        <button
          className="primary roll-button"
          disabled={!canRoll}
          onClick={() =>
            poolLabel &&
            performRoll({
              campaign,
              instanceLabel: instance ? instance.label : campaign.name,
              poolLabel,
              poolRating,
            })
          }
        >
          <IconDice /> {t('roller.roll')}
        </button>
      </div>
    </div>
  );
}
