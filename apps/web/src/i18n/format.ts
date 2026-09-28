import type { Locale } from './locales';

/**
 * Разделитель разрядов по языку. Форматируем вручную, а не через Intl:
 * так разметка на сервере и в браузере совпадает байт в байт и гидрация
 * не ломается на разнице версий ICU.
 */
const GROUP: Record<Locale, string> = {
  es: ' ',
  en: ',',
  ru: ' ',
  nl: '.',
  de: '.',
  fr: ' ',
  pl: ' ',
  sv: ' ',
};

/** Десятичный знак — для «1,25 млн» и подобных подписей. */
const DECIMAL: Record<Locale, string> = {
  es: ',',
  en: '.',
  ru: ',',
  nl: ',',
  de: ',',
  fr: ',',
  pl: ',',
  sv: ',',
};

export const groupDigits = (value: number, locale: Locale): string =>
  String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, GROUP[locale]);

export const decimalMark = (locale: Locale): string => DECIMAL[locale];

/** Символ евро: в большинстве европейских языков он идёт после суммы. */
export const money = (value: number, locale: Locale): string =>
  locale === 'en' ? `€${groupDigits(value, locale)}` : `${groupDigits(value, locale)} €`;
