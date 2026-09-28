import { describe, expect, it } from 'vitest';
import { promotedSlots, representativeOffer, tierRank } from '../src/properties/visibility';

const offer = (
  id: string,
  price: number,
  verified: boolean,
  tier: 'NONE' | 'BUMP' | 'FEATURED' | 'TOP_AREA' = 'NONE',
) => ({ id, price, verified, promotionTier: tier });

describe('сила уровней продвижения', () => {
  it('растёт от бесплатного к топу района', () => {
    expect(tierRank('NONE')).toBeLessThan(tierRank('BUMP'));
    expect(tierRank('BUMP')).toBeLessThan(tierRank('FEATURED'));
    expect(tierRank('FEATURED')).toBeLessThan(tierRank('TOP_AREA'));
  });
});

describe('оплаченные слоты', () => {
  it('без покупок слотов нет', () => {
    expect(promotedSlots([offer('a', 285_000, true), offer('b', 289_000, false)])).toHaveLength(0);
  });

  it('копия создаётся только у того, кто заплатил', () => {
    const slots = promotedSlots([
      offer('free', 285_000, true),
      offer('paid', 295_000, false, 'FEATURED'),
    ]);
    expect(slots).toHaveLength(1);
    expect(slots[0].id).toBe('paid');
    // В копии — цена заплатившего, а не самая низкая по объекту.
    expect(slots[0].price).toBe(295_000);
  });

  it('купили два агентства — наверху две копии', () => {
    const slots = promotedSlots([
      offer('free', 280_000, true),
      offer('paid1', 295_000, false, 'FEATURED'),
      offer('paid2', 290_000, false, 'FEATURED'),
    ]);
    expect(slots.map((s) => s.id)).toEqual(['paid2', 'paid1']);
  });

  it('кто купил дороже, тот выше', () => {
    const slots = promotedSlots([
      offer('featured', 285_000, false, 'FEATURED'),
      offer('top', 299_000, false, 'TOP_AREA'),
    ]);
    expect(slots[0].id).toBe('top');
  });

  it('когда срок вышел, копия исчезает и остаётся одна карточка', () => {
    const during = [offer('free', 285_000, true), offer('paid', 295_000, false, 'FEATURED')];
    expect(promotedSlots(during)).toHaveLength(1);

    // Истёкшее продвижение приходит из базы уже как NONE.
    const after = during.map((o) => ({ ...o, promotionTier: 'NONE' as const }));
    expect(promotedSlots(after)).toHaveLength(0);
    expect(representativeOffer(after)?.id).toBe('free');
  });
});

describe('органическая карточка', () => {
  it('не зависит от того, кто заплатил', () => {
    const offers = [offer('cheap-verified', 285_000, true), offer('paid', 295_000, false, 'TOP_AREA')];
    expect(representativeOffer(offers)?.id).toBe('cheap-verified');
  });

  it('проверенное важнее дешёвого', () => {
    expect(representativeOffer([offer('cheap', 280_000, false), offer('ok', 289_000, true)])?.id).toBe('ok');
  });

  it('при равном статусе решает цена', () => {
    expect(representativeOffer([offer('a', 289_000, true), offer('b', 285_000, true)])?.id).toBe('b');
  });

  it('на пустом списке ничего не возвращает', () => {
    expect(representativeOffer([])).toBeUndefined();
  });
});
