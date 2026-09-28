/**
 * Языки портала. Набор взят из бизнес-плана: испанский — язык рынка,
 * остальные — языки покупателей, ради которых строится мультиязычное SEO
 * (нидерландцы — №1 среди не-резидентов Коста-Бланки).
 */
export const LOCALES = ['es', 'en', 'ru', 'nl', 'de', 'fr', 'pl', 'sv'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

/** Подпись в переключателе — на самом языке, как принято у порталов. */
export const LOCALE_NAMES: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  ru: 'Русский',
  nl: 'Nederlands',
  de: 'Deutsch',
  fr: 'Français',
  pl: 'Polski',
  sv: 'Svenska',
};

/** Короткий код в шапке. */
export const LOCALE_SHORT: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
  ru: 'RU',
  nl: 'NL',
  de: 'DE',
  fr: 'FR',
  pl: 'PL',
  sv: 'SV',
};

/** Полные теги для hreflang и атрибута lang. */
export const LOCALE_TAGS: Record<Locale, string> = {
  es: 'es-ES',
  en: 'en-GB',
  ru: 'ru-RU',
  nl: 'nl-NL',
  de: 'de-DE',
  fr: 'fr-FR',
  pl: 'pl-PL',
  sv: 'sv-SE',
};

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/** Путь внутри локали: `/en/search` и т. д. */
export const localePath = (locale: Locale, path = ''): string => {
  const clean = path.replace(/^\/+/, '');
  return clean ? `/${locale}/${clean}` : `/${locale}`;
};

/**
 * Подбирает язык по заголовку Accept-Language.
 * Разбираем вручную: зависимость ради одной функции не нужна.
 */
export function matchLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}
