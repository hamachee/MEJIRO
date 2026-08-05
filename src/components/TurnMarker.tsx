import { useTranslation } from 'react-i18next';

/**
 * The ◤ corner button in a table card's top-left: clicking it makes that
 * card the current turn in the turn tracker (highlighting the card), and
 * clicking the already-current card clears the highlight.
 */
export function TurnMarker({ current, onToggle, label }: {
  current: boolean;
  onToggle: () => void;
  label: string;
}) {
  const { t } = useTranslation();
  return (
    <button
      className={`turn-marker ${current ? 'current' : ''}`}
      aria-label={`${t('gm.currentTurn')}: ${label}`}
      aria-pressed={current}
      onClick={onToggle}
    >
      ◤
    </button>
  );
}
