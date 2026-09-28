import type { PromotionTier } from '@prisma/client';

/** Сила уровней продвижения, от слабого к сильному. */
const TIER_ORDER: PromotionTier[] = ['NONE', 'BUMP', 'FEATURED', 'TOP_AREA'];

export const tierRank = (tier: PromotionTier): number => TIER_ORDER.indexOf(tier);

export interface OfferLike {
  id: string;
  price: number;
  verified: boolean;
  promotionTier: PromotionTier;
}

/**
 * Какое предложение представляет объект в обычной выдаче.
 *
 * Продвижение здесь не участвует: органическая карточка всегда лучшая
 * для покупателя — проверенная, при равенстве самая дешёвая. Оплаченные
 * показы живут отдельными слотами наверху.
 */
export function representativeOffer<T extends OfferLike>(offers: T[]): T | undefined {
  return [...offers].sort(
    (a, b) => Number(b.verified) - Number(a.verified) || a.price - b.price,
  )[0];
}

/**
 * Оплаченные слоты: по одному на каждую купленную рекламу.
 *
 * Купили несколько агентств — наверху окажется несколько карточек одного
 * объекта, у каждой своя цена и своё агентство. Сильнее тот, кто купил
 * дороже; при равном уровне — тот, у кого дешевле.
 */
export function promotedSlots<T extends OfferLike>(offers: T[]): T[] {
  return offers
    .filter((o) => o.promotionTier !== 'NONE')
    .sort(
      (a, b) => tierRank(b.promotionTier) - tierRank(a.promotionTier) || a.price - b.price,
    );
}
