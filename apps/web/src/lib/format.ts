import type { Listing, ListingCard, Mode } from './types';

/** Месячная аренда как доля от цены продажи — витринный коэффициент портала. */
export const RENT_RATIO = 0.0045;

/**
 * Разряды разделяются неразрывным пробелом — как в ru-RU.
 * Форматируем вручную, чтобы разметка на сервере и в браузере совпадала байт в байт.
 */
export function groupDigits(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const fmt = (value: number): string => `${groupDigits(value)} €`;

export const pricePerM2 = (price: number, area: number): string =>
  `${groupDigits(price / area)} €/м²`;

export const rentOf = (price: number): number => Math.round((price * RENT_RATIO) / 10) * 10;

export const priceOf = (price: number, mode: Mode): number =>
  mode === 'rent' ? rentOf(price) : price;

const plural = (n: number, one: string, few: string) => (n === 1 ? one : few);

export const specsOf = (l: Pick<Listing, 'bedrooms' | 'area' | 'bathrooms'>): string =>
  `${l.bedrooms} ${plural(l.bedrooms, 'спальня', 'спальни')} · ${l.area} м² · ` +
  `${l.bathrooms} ${plural(l.bathrooms, 'ванная', 'ванные')}`;

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('');

/** Короткая подпись пина на карте: «485 тыс €» / «1,25 млн €». */
export const pinLabel = (price: number, mode: Mode): string => {
  if (mode === 'rent') return fmt(rentOf(price));
  if (price >= 1e6) return `${(price / 1e6).toFixed(2).replace('.', ',')} млн €`;
  return `${Math.round(price / 1000)} тыс €`;
};

/** Приводит объект из API к виду, в котором его рисует карточка. */
export function toCard(l: Listing, mode: Mode): ListingCard {
  const price = priceOf(l.price, mode);
  return {
    ...l,
    href: `/listing/${l.slug}`,
    priceLabel: mode === 'rent' ? `${fmt(price)} / мес` : fmt(price),
    subLabel: mode === 'rent' ? 'без комиссии' : pricePerM2(l.price, l.area),
    specs: specsOf(l),
    agentInitials: l.agency.initials || initialsOf(l.agency.name),
    dateLabel: 'сегодня',
    badge: mode === 'rent' ? null : l.badge,
  };
}
