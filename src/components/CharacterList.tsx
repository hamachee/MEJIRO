import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCharacterStore } from '../store/characterStore';
import { exportCharacter, defaultTricks } from '../storage/characters';
import { TEMPLATE_LIST, getTemplate, DEFAULT_TEMPLATE_ID } from '../templates';
import { label } from '../lib/localize';
import { useLang } from '../lib/useLang';
import type { Character } from '../types/character';

/** Make a string safe to use as one dot-separated part of a filename. */
function filenamePart(s: string): string {
  return s.trim().replace(/[\\/:*?"<>|]+/g, '_') || 'unknown';
}

export function CharacterList() {
  const { t } = useTranslation();
  const lang = useLang();
  const navigate = useNavigate();

  const roster = useCharacterStore((s) => s.roster);
  const create = useCharacterStore((s) => s.create);
  const remove = useCharacterStore((s) => s.remove);
  const importFromJson = useCharacterStore((s) => s.importFromJson);

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const fileInput = useRef<HTMLInputElement>(null);

  const onCreate = async () => {
    const template = getTemplate(templateId);
    if (!template) return;
    const character = await create(
      template,
      name,
      defaultTricks([
        t('tricks.defaultOne'),
        t('tricks.defaultTwo'),
        t('tricks.defaultThree'),
      ]),
    );
    setName('');
    navigate(`/character/${character.id}`);
  };

  const onExport = (character: Character) => {
    const blob = new Blob([exportCharacter(character)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const tpl = getTemplate(character.templateId);
    const system = filenamePart(tpl ? label(tpl.name, lang) : character.templateId);
    const charName = filenamePart(character.name);
    a.download = `MEJIRO.${system}.${charName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importFromJson(text);
    } catch (err) {
      alert(
        t('characters.importError', {
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const onDelete = async (character: Character) => {
    if (confirm(t('characters.confirmDelete'))) await remove(character.id);
  };

  return (
    <div className="stack">
      <section className="card">
        <h1>{t('characters.new')}</h1>
        <div className="form-row">
          <input
            className="grow"
            placeholder={t('characters.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          />
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            aria-label={t('characters.system')}
          >
            {TEMPLATE_LIST.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {label(tpl.name, lang)}
              </option>
            ))}
          </select>
          <button className="primary" onClick={onCreate}>
            {t('characters.create')}
          </button>
        </div>
        <div className="form-row">
          <button onClick={() => fileInput.current?.click()}>
            {t('characters.import')}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onImportFile}
          />
        </div>
      </section>

      <section className="card">
        <h2>{t('characters.title')}</h2>
        {roster.length === 0 ? (
          <p className="muted">{t('characters.empty')}</p>
        ) : (
          <ul className="roster">
            {roster.map((c) => {
              const tpl = getTemplate(c.templateId);
              return (
                <li key={c.id} className="roster-item">
                  <button
                    className="roster-open"
                    onClick={() => navigate(`/character/${c.id}`)}
                  >
                    <strong>{c.name}</strong>
                    <small className="muted">
                      {tpl ? label(tpl.name, lang) : c.templateId}
                    </small>
                  </button>
                  <div className="roster-actions">
                    <button onClick={() => onExport(c)}>
                      {t('characters.export')}
                    </button>
                    <button className="danger" onClick={() => onDelete(c)}>
                      {t('characters.delete')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
