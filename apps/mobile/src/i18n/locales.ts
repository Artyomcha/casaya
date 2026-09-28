/** Те же восемь языков, что на портале. */
export const LOCALES = ['es', 'en', 'ru', 'nl', 'de', 'fr', 'pl', 'sv'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

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

/** Разделитель разрядов по языку — как на портале. */
const GROUP: Record<Locale, string> = {
  es: ' ', en: ',', ru: ' ', nl: '.',
  de: '.', fr: ' ', pl: ' ', sv: ' ',
};

const DECIMAL: Record<Locale, string> = {
  es: ',', en: '.', ru: ',', nl: ',', de: ',', fr: ',', pl: ',', sv: ',',
};

export const groupDigits = (value: number, locale: Locale): string =>
  String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, GROUP[locale]);

export const decimalMark = (locale: Locale): string => DECIMAL[locale];

export const money = (value: number, locale: Locale): string =>
  locale === 'en' ? `€${groupDigits(value, locale)}` : `${groupDigits(value, locale)} €`;

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);
