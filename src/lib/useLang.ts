import { useTranslation } from 'react-i18next';

/** Current UI language code, for resolving multilingual template labels. */
export function useLang(): string {
  const { i18n } = useTranslation();
  return i18n.language || 'en';
}
