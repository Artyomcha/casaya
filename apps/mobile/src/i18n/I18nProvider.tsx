import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getLocales } from 'expo-localization';
import de from './dictionaries/de';
import en from './dictionaries/en';
import es from './dictionaries/es';
import fr from './dictionaries/fr';
import nl from './dictionaries/nl';
import pl from './dictionaries/pl';
import ru, { type Dictionary } from './dictionaries/ru';
import sv from './dictionaries/sv';
import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';

const DICTIONARIES: Record<Locale, Dictionary> = { es, en, ru, nl, de, fr, pl, sv };

const STORAGE_KEY = 'casaya:locale';

interface I18n {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
}

const Ctx = createContext<I18n | null>(null);

/** Язык системы, если он среди наших. Иначе испанский — рынок испанский. */
function deviceLocale(): Locale {
  const tag = getLocales()[0]?.languageCode ?? '';
  return isLocale(tag) ? tag : DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);

  // Выбор языка переживает перезапуск: он сохраняется отдельно от языка системы.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && isLocale(saved)) setLocaleState(saved);
      })
      .catch(() => {
        /* хранилище недоступно — остаёмся на языке системы */
      });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* не сохранилось — язык всё равно сменится в этой сессии */
    });
  }, []);

  const value = useMemo<I18n>(
    () => ({ locale, dict: DICTIONARIES[locale], setLocale }),
    [locale, setLocale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n вызван вне I18nProvider');
  return ctx;
}

/** Короткий доступ к словарю — им пользуется большинство экранов. */
export const useT = (): Dictionary => useI18n().dict;
