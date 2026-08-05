import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  exportListFile,
  parseListImport,
  type ListKind,
  type normalizeEntry,
} from '../lib/listExchange';
import { IconExport, IconImport, IconTrash } from './icons';

type EntryOf<K extends ListKind> = ReturnType<(typeof normalizeEntry)[K]>;

/**
 * Edit-mode toolbar for a sheet list: export it as a JSON file, import a
 * file (appending or replacing), or clear the list. Destructive actions
 * (replace, clear) always confirm first.
 */
export function ListImportExport<K extends ListKind>({
  kind,
  items,
  ownerName,
  onChange,
  compact = false,
}: {
  kind: K;
  items: EntryOf<K>[];
  /** Character/campaign name, used in the exported filename. */
  ownerName: string;
  onChange: (items: EntryOf<K>[]) => void;
  /** Icon-only export/clear, short add/replace labels — for a narrow toolbar. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  // Which import the pending file pick belongs to; set before opening the picker.
  const mode = useRef<'add' | 'replace'>('add');

  const pick = (m: 'add' | 'replace') => {
    mode.current = m;
    fileInput.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseListImport(await file.text(), kind);
      if (mode.current === 'replace') {
        if (!confirm(t('listIO.confirmReplace', { count: imported.length }))) return;
        onChange(imported);
      } else {
        onChange([...items, ...imported]);
      }
    } catch (err) {
      alert(
        t('listIO.importError', {
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const onClear = () => {
    if (!confirm(t('listIO.confirmClear'))) return;
    onChange([]);
  };

  return (
    <div className="form-row list-io">
      <button
        title={t('listIO.export')}
        onClick={() => exportListFile(kind, items, ownerName)}
        disabled={items.length === 0}
      >
        <IconExport /> {!compact && t('listIO.export')}
      </button>
      <button title={t('listIO.importAdd')} onClick={() => pick('add')}>
        <IconImport /> {compact ? t('listIO.add') : t('listIO.importAdd')}
      </button>
      <button title={t('listIO.importReplace')} onClick={() => pick('replace')}>
        <IconImport /> {compact ? t('listIO.replace') : t('listIO.importReplace')}
      </button>
      <button
        title={t('listIO.clear')}
        className="danger"
        onClick={onClear}
        disabled={items.length === 0}
      >
        <IconTrash /> {!compact && t('listIO.clear')}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={onFile}
      />
    </div>
  );
}
