import type { Dictionary } from '@/i18n/getDictionary';
import { decimalMark, groupDigits, money } from '@/i18n/format';
import type { Locale } from '@/i18n/locales';
import type { Listing, ListingCard, Mode, Savings } from './types';

/** Месячная аренда как доля от цены продажи — витринный коэффициент портала. */
export const RENT_RATIO = 0.0045;

export const rentOf = (price: number): number => Math.round((price * RENT_RATIO) / 10) * 10;

export const priceOf = (price: number, mode: Mode): number =>
  mode === 'rent' ? rentOf(price) : price;

export const pricePerM2 = (price: number, area: number, locale: Locale, dict: Dictionary): string =>
  `${groupDigits(price / area, locale)} ${dict.common.perSqm}`;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const specsOf = (
  l: Pick<Listing, 'bedrooms' | 'area' | 'bathrooms'>,
  dict: Dictionary,
): string =>
  `${l.bedrooms} ${plural(l.bedrooms, dict.common.bedroomOne, dict.common.bedroomMany)} · ` +
  `${l.area} ${dict.common.sqm} · ` +
  `${l.bathrooms} ${plural(l.bathrooms, dict.common.bathroomOne, dict.common.bathroomMany)}`;

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('');

/** Короткая подпись пина на карте: «485 тыс €» / «1,25 млн €». */
export const pinLabel = (price: number, mode: Mode, locale: Locale): string => {
  if (mode === 'rent') return money(rentOf(price), locale);
  if (price >= 1e6) return `${(price / 1e6).toFixed(2).replace('.', decimalMark(locale))} M €`;
  return `${Math.round(price / 1000)}K €`;
};

/**
 * «−11%» — короткая метка выгоды. Процент округляется до целого: десятые
 * в бейдже не читаются, а точную разницу покупатель всё равно видит рядом
 * двумя цифрами — ценой на Casaya и рыночной. Минус типографский, не дефис.
 */
export const discountLabel = (savings: Savings): string => `−${Math.round(savings.percent)}%`;

/** Приводит объект из API к виду, в котором его рисует карточка. */
export function toCard(l: Listing, mode: Mode, locale: Locale, dict: Dictionary): ListingCard {
  const price = priceOf(l.price, mode);
  return {
    ...l,
    href: `/${locale}/listing/${l.slug}`,
    priceLabel: mode === 'rent' ? `${money(price, locale)} ${dict.common.perMonth}` : money(price, locale),
    subLabel: mode === 'rent' ? dict.common.noCommission : pricePerM2(l.price, l.area, locale, dict),
    specs: specsOf(l, dict),
    agentInitials: l.agency.initials || initialsOf(l.agency.name),
    dateLabel: dict.common.today,
    badge: mode === 'rent' ? null : l.badge,
    offersCount: l.offersCount ?? 1,
    promoted: l.promoted ?? false,
    /// В аренде экономия не показывается: рыночная цена задана для продажи.
    savings: mode === 'rent' ? null : (l.savings ?? null),
    marketLabel: mode === 'rent' || !l.marketPrice ? null : money(l.marketPrice, locale),
  };
}

export { groupDigits, money };
