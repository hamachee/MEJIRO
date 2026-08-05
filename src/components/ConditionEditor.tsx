import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uid } from '../lib/uid';
import { IconClose } from './icons';
import type { ConditionItem } from '../types/character';

/**
 * Status-effect tag chips with an add field — the conditions block shared
 * by the GM's adversary cards and PC cards. Always editable: conditions
 * shift constantly in play, so there's no edit-mode gate.
 */
export function ConditionEditor({
  conditions,
  onChange,
}: {
  conditions: ConditionItem[];
  onChange: (next: ConditionItem[]) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const add = () => {
    if (!name.trim()) return;
    onChange([...conditions, { id: uid(), name: name.trim() }]);
    setName('');
  };

  return (
    <div>
      <span className="field-label">{t('sheet.conditions')}</span>
      <div className="condition-chips">
        {conditions.length === 0 && <span className="muted">—</span>}
        {conditions.map((c) => (
          <span key={c.id} className="condition">
            {c.name}
            <button
              aria-label={`remove ${c.name}`}
              onClick={() => onChange(conditions.filter((x) => x.id !== c.id))}
            >
              <IconClose />
            </button>
          </span>
        ))}
      </div>
      <div className="form-row">
        <input
          className="grow"
          placeholder={t('gm.conditionPlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button onClick={add}>{t('sheet.add')}</button>
      </div>
    </div>
  );
}
