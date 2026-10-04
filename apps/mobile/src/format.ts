import type { Dictionary } from './i18n/dictionaries/ru';
import { decimalMark, groupDigits, money, type Locale } from './i18n/locales';
import type { Listing, Mode, Savings } from './types';

export const RENT_RATIO = 0.0045;

export const rentOf = (price: number): number => Math.round((price * RENT_RATIO) / 10) * 10;

/**
 * Склонение множественного числа. Русский — единственный из восьми языков,
 * где форма зависит не от «один или не один», а от остатка: «1 объект,
 * 2 объекта, 5 объектов». Остальные обходятся парой форм.
 */
export function plural(n: number, locale: Locale, one: string, few: string, many: string): string {
  if (locale !== 'ru') return n === 1 ? one : many;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return few;
  return many;
}

export const specsOf = (
  l: Pick<Listing, 'bedrooms' | 'area' | 'bathrooms'>,
  locale: Locale,
  dict: Dictionary,
): string =>
  `${l.bedrooms} ${plural(l.bedrooms, locale, dict.common.bedroomOne, dict.common.bedroomMany, dict.common.bedroomMany)} · ` +
  `${l.area} ${dict.common.sqm} · ` +
  `${l.bathrooms} ${plural(l.bathrooms, locale, dict.common.bathroomOne, dict.common.bathroomMany, dict.common.bathroomMany)}`;

export const priceLabel = (price: number, mode: Mode, locale: Locale, dict: Dictionary): string =>
  mode === 'rent' ? `${money(rentOf(price), locale)} ${dict.common.perMonth}` : money(price, locale);

export const perM2Label = (l: Listing, mode: Mode, locale: Locale, dict: Dictionary): string =>
  mode === 'rent'
    ? dict.common.noCommission
    : `${groupDigits(l.price / l.area, locale)} ${dict.common.perSqm}`;

/**
 * «−11%» — короткая метка выгоды. Процент округляется до целого: десятые
 * в бейдже не читаются, а точную разницу видно рядом двумя ценами.
 * Минус типографский, не дефис.
 */
export const discountLabel = (savings: Savings): string => `−${Math.round(savings.percent)}%`;

/**
 * Короткая подпись на пине карты. Сокращения «тыс» и «млн» переводить
 * не стали: на карте важнее, чтобы подпись была узкой, а цифры читаются
 * одинаково на всех языках.
 */
export const pinLabel = (price: number, mode: Mode, locale: Locale): string => {
  if (mode === 'rent') return money(rentOf(price), locale);
  if (price >= 1e6) return `${(price / 1e6).toFixed(2).replace('.', decimalMark(locale))} M €`;
  return `${Math.round(price / 1000)}K €`;
};

/** Счётчик результатов со склонением. */
export const countLabel = (n: number, locale: Locale, dict: Dictionary): string =>
  `${n} ${plural(n, locale, dict.common.objectOne, dict.common.objectFew, dict.common.objectMany)}`;

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('');

const RATE = 0.032;

/** Аннуитетный платёж — та же формула, что в API и на портале. */
export function monthlyPayment(price: number, downPercent: number, termYears: number) {
  const loan = price * (1 - downPercent / 100);
  const r = RATE / 12;
  const n = termYears * 12;
  return { loan, monthly: (loan * r) / (1 - Math.pow(1 + r, -n)) };
}

export { groupDigits, money };
