import { useTranslation } from 'react-i18next';
import { useLang } from '../lib/useLang';

/**
 * A translated UI label with the English original as a small sublabel when
 * the UI language differs. For Curseborne terms baked into the app's UI
 * chrome (Entanglement, Skills, Armor, ...) rather than template data — the
 * Korean text is an unofficial fan translation, so the source term stays
 * visible, same treatment as the `L` component gives template-driven labels.
 */
export function FieldLabel({ i18nKey, en }: { i18nKey: string; en: string }) {
  const { t } = useTranslation();
  const lang = useLang();
  return (
    <>
      {t(i18nKey)}
      {lang !== 'en' && <small className="label-en">{en}</small>}
    </>
  );
}
