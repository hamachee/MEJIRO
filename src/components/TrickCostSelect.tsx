import { useTranslation } from 'react-i18next';
import type { CharacterTrick } from '../types/character';

/** The 1/2/3/1~3 cost picker, shared by the add and edit forms on both trick lists. */
export function TrickCostSelect({
  value,
  onChange,
}: {
  value: CharacterTrick['cost'];
  onChange: (cost: CharacterTrick['cost']) => void;
}) {
  const { t } = useTranslation();
  return (
    <label className="field">
      <span className="field-label">{t('tricks.cost')}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value === 'variable' ? 'variable' : Number(e.target.value))}
      >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value="variable">1~3</option>
      </select>
    </label>
  );
}
