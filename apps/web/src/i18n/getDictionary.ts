import 'server-only';
import type { Locale } from './locales';
import type { Dictionary } from './dictionaries/ru';

/**
 * Словари грузятся динамически: в бандл страницы попадает только нужный язык,
 * а не все восемь сразу.
 */
const loaders: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  es: () => import('./dictionaries/es'),
  en: () => import('./dictionaries/en'),
  ru: () => import('./dictionaries/ru'),
  nl: () => import('./dictionaries/nl'),
  de: () => import('./dictionaries/de'),
  fr: () => import('./dictionaries/fr'),
  pl: () => import('./dictionaries/pl'),
  sv: () => import('./dictionaries/sv'),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const mod = await loaders[locale]();
  return mod.default;
}

export type { Dictionary };
