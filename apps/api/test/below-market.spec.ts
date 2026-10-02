import { describe, expect, it } from 'vitest';
import {
  MAX_DISCOUNT_PERCENT,
  MIN_DISCOUNT_PERCENT,
  belowMarket,
  pricingProblem,
  savingsOf,
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

  it('порог ровно на границе засчитывается', () => {
    const market = 100_000;
    const price = market * (1 - MIN_DISCOUNT_PERCENT / 100);
    expect(savingsOf(price, market)?.percent).toBe(MIN_DISCOUNT_PERCENT);
    expect(belowMarket(price, market)).toBe(true);
    // Порог сверяется с тем же числом, которое видит покупатель, —
    // с процентом, округлённым до десятых. Поэтому лишний евро границу
    // не сдвигает, а сотня уже уводит показатель ниже порога.
    expect(belowMarket(price + 1, market)).toBe(true);
    expect(savingsOf(price + 100, market)?.percent).toBe(2.9);
    expect(belowMarket(price + 100, market)).toBe(false);
  });

  it('объект выпадает, как только агент поднял цену', () => {
    const market = 258_000;
    expect(belowMarket(230_000, market)).toBe(true);
    expect(belowMarket(252_000, market)).toBe(false);
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

  it('скидка меньше порога — отдельная причина, её агент может исправить', () => {
    expect(pricingProblem(256_000, 258_000)).toBe('too-small');
  });

  it('скидка больше половины — предупреждение об опечатке в нулях', () => {
    expect(pricingProblem(23_000, 258_000)).toBe('too-big');
    expect(MAX_DISCOUNT_PERCENT).toBeGreaterThan(MIN_DISCOUNT_PERCENT);
  });
});
