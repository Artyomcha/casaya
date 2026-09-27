import type { Listing, Mode } from './types';

export const RENT_RATIO = 0.0045;

/** Разряды неразрывным пробелом, как в ru-RU. */
export const groupDigits = (value: number): string =>
  String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const fmt = (value: number): string => `${groupDigits(value)} €`;

export const rentOf = (price: number): number => Math.round((price * RENT_RATIO) / 10) * 10;

const plural = (n: number, one: string, few: string) => (n === 1 ? one : few);

export const specsOf = (l: Pick<Listing, 'bedrooms' | 'area' | 'bathrooms'>): string =>
  `${l.bedrooms} ${plural(l.bedrooms, 'спальня', 'спальни')} · ${l.area} м² · ` +
  `${l.bathrooms} ${plural(l.bathrooms, 'ванная', 'ванные')}`;

export const priceLabel = (price: number, mode: Mode): string =>
  mode === 'rent' ? `${fmt(rentOf(price))} / мес` : fmt(price);

export const perM2Label = (l: Listing, mode: Mode): string =>
  mode === 'rent' ? 'без комиссии' : `${groupDigits(l.price / l.area)} €/м²`;

/** Короткая подпись на пине карты: «485 тыс» / «1,25 млн». */
export const pinLabel = (price: number, mode: Mode): string => {
  if (mode === 'rent') return `${groupDigits(rentOf(price))} €`;
  if (price >= 1e6) return `${(price / 1e6).toFixed(2).replace('.', ',')} млн`;
  return `${Math.round(price / 1000)} тыс`;
};

/** Склонение счётчика результатов. */
export const countLabel = (n: number): string => {
  const word =
    n % 10 === 1 && n % 100 !== 11
      ? 'объект'
      : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)
        ? 'объекта'
        : 'объектов';
  return `${n} ${word}`;
};

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
