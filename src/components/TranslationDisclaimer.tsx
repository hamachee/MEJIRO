import { useTranslation } from 'react-i18next';
import { useLang } from '../lib/useLang';

/**
 * A plain, clearly-visible notice (not muted/hint styling) that this
 * system's Korean terms are an unofficial fan translation — its own card
 * at the very bottom of the page. Korean UI only, and only for templates
 * that actually carry a Korean fan translation (Curseborne today).
 */
export function TranslationDisclaimer({ templateId }: { templateId: string }) {
  const { t } = useTranslation();
  const lang = useLang();
  if (lang !== 'ko' || templateId !== 'curseborne') return null;
  return (
    <section className="card">
      <p className="translation-notice">{t('common.translationDisclaimer')}</p>
    </section>
  );
}
