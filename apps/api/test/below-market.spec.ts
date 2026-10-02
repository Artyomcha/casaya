import { describe, expect, it } from 'vitest';
import {
  SUSPICIOUS_DISCOUNT_PERCENT,
  belowMarket,
  pricingProblem,
  savingsOf,
  suspiciousDiscount,
} from '../src/pricing/below-market';

describe('экономия', () => {
  it('считает разницу в евро и процентах', () => {
    expect(savingsOf(230_000, 258_000)).toEqual({ amount: 28_000, percent: 10.9 });
  });

  it('процент округляется до десятых, а не до целых', () => {
    // 1000 / 199000 = 0.5025…%
    expect(savingsOf(198_000, 199_000)?.percent).toBe(0.5);
  });

  it('без рыночной цены экономии нет', () => {
    expect(savingsOf(200_000, null)).toBeNull();
    expect(savingsOf(200_000, undefined)).toBeNull();
  });

  it('цена не ниже рыночной — экономии нет, а не отрицательная', () => {
    expect(savingsOf(200_000, 200_000)).toBeNull();
    expect(savingsOf(210_000, 200_000)).toBeNull();
  });

  it('мусор в числах не превращается в скидку', () => {
    expect(savingsOf(NaN, 200_000)).toBeNull();
    expect(savingsOf(200_000, NaN)).toBeNull();
    expect(savingsOf(0, 200_000)).toBeNull();
    expect(savingsOf(200_000, -1)).toBeNull();
  });
});

describe('правило выдачи', () => {
  it('пропускает объект заметно ниже рынка', () => {
    expect(belowMarket(230_000, 258_000)).toBe(true);
  });

  it('не пропускает объект вровень с рынком', () => {
    expect(belowMarket(258_000, 258_000)).toBe(false);
  });

  it('порога нет: любая цена ниже рынка проходит', () => {
    // Насколько именно ниже — дело агентства, оно платит за показ.
    expect(belowMarket(99_999, 100_000)).toBe(true);
    expect(belowMarket(50_000, 100_000)).toBe(true);
    expect(belowMarket(100_000, 100_000)).toBe(false);
  });

  it('объект выпадает, как только агент догнал рынок', () => {
    const market = 258_000;
    expect(belowMarket(230_000, market)).toBe(true);
    expect(belowMarket(252_000, market)).toBe(true);
    expect(belowMarket(258_000, market)).toBe(false);
  });
});

describe('разбор проблемы для кабинета', () => {
  it('всё в порядке — null', () => {
    expect(pricingProblem(230_000, 258_000)).toBeNull();
  });

  it('различает отсутствие цены и цену не ниже рынка', () => {
    expect(pricingProblem(230_000, null)).toBe('no-market-price');
    expect(pricingProblem(260_000, 258_000)).toBe('not-below-market');
  });

  it('крошечная скидка — не проблема: порога у витрины нет', () => {
    expect(pricingProblem(256_000, 258_000)).toBeNull();
  });
});

describe('подозрительная скидка', () => {
  it('больше половины — похоже на лишний ноль', () => {
    expect(suspiciousDiscount(23_000, 258_000)).toBe(true);
    expect(SUSPICIOUS_DISCOUNT_PERCENT).toBe(50);
  });

  it('обычная скидка подозрений не вызывает', () => {
    expect(suspiciousDiscount(230_000, 258_000)).toBe(false);
  });

  it('предупреждение объект не прячет', () => {
    expect(belowMarket(23_000, 258_000)).toBe(true);
    expect(pricingProblem(23_000, 258_000)).toBeNull();
  });
});
