import { useMemo } from 'react';
import { TranslationKeys, TranslationFunction, Language } from './index';
import norwegianTranslations from './translations/no.json';

const translations: Record<Language, TranslationKeys> = {
  no: norwegianTranslations as TranslationKeys
};

export function useTranslation(language: Language = 'no') {
  const t: TranslationFunction = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const keys = key.split('.');
      let value: unknown = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[k];
        }
      }
      
      if (typeof value !== 'string') {
        return key;
      }
      
      // Simple parameter replacement
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
          return params[paramKey]?.toString() || match;
        });
      }
      
      return value;
    };
  }, [language]);
  
  return { t, language };
}