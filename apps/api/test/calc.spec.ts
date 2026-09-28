import { describe, expect, it } from 'vitest';
import { BASE_RATE, MortgageService } from '../src/mortgage/mortgage.service';
import { BASE_PRICE_PER_M2, ValuationService } from '../src/valuation/valuation.service';
import { TARIFFS } from '../src/promotions/promotions.service';

const mortgage = new MortgageService();

describe('расчёт ипотеки', () => {
  it('совпадает с витриной портала: 485 000 € под 30% на 25 лет', () => {
    const r = mortgage.calculate({ price: 485_000, downPaymentPercent: 30, termYears: 25 });
    expect(r.loan).toBe(339_500);
    expect(r.monthly).toBe(1_645);
  });

  it('первый взнос вычитается из тела кредита', () => {
    const r = mortgage.calculate({ price: 300_000, downPaymentPercent: 40, termYears: 20 });
    expect(r.downPayment).toBe(120_000);
    expect(r.loan).toBe(180_000);
  });

  it('чем длиннее срок, тем меньше платёж и больше переплата', () => {
    const short = mortgage.calculate({ price: 300_000, downPaymentPercent: 30, termYears: 10 });
    const long = mortgage.calculate({ price: 300_000, downPaymentPercent: 30, termYears: 25 });
    expect(long.monthly).toBeLessThan(short.monthly);
    expect(long.overpay).toBeGreaterThan(short.overpay);
  });

  it('сумма платежей равна кредиту плюс переплата', () => {
    const r = mortgage.calculate({ price: 400_000, downPaymentPercent: 35, termYears: 15 });
    expect(r.totalPaid).toBe(r.loan + r.overpay);
  });

  it('ставку можно переопределить', () => {
    const base = mortgage.calculate({ price: 300_000, downPaymentPercent: 30, termYears: 20 });
    const cheaper = mortgage.calculate({ price: 300_000, downPaymentPercent: 30, termYears: 20, rate: 0.02 });
    expect(cheaper.monthly).toBeLessThan(base.monthly);
    expect(base.rate).toBe(BASE_RATE);
  });
});

describe('автоматическая оценка', () => {
  // estimate() не обращается к базе, поэтому Prisma сюда можно не подставлять.
  const valuation = new ValuationService(null as never);

  it('считает от базовой цены м² по типу объекта', () => {
    const r = valuation.estimate({ address: 'x', kind: 'FLAT', area: 100, bedrooms: 2 });
    expect(r.estimate).toBe(BASE_PRICE_PER_M2.FLAT! * 100);
  });

  it('каждая спальня сверх двух добавляет 3%', () => {
    const two = valuation.estimate({ address: 'x', kind: 'FLAT', area: 100, bedrooms: 2 }).estimate;
    const four = valuation.estimate({ address: 'x', kind: 'FLAT', area: 100, bedrooms: 4 }).estimate;
    expect(four / two).toBeCloseTo(1.06, 2);
  });

  it('вилла дешевле квартиры за метр, пентхаус дороже', () => {
    expect(BASE_PRICE_PER_M2.HOUSE!).toBeLessThan(BASE_PRICE_PER_M2.FLAT!);
    expect(BASE_PRICE_PER_M2.PENTHOUSE!).toBeGreaterThan(BASE_PRICE_PER_M2.FLAT!);
  });

  it('диапазон симметричен вокруг оценки с точностью до округления', () => {
    const r = valuation.estimate({ address: 'x', kind: 'FLAT', area: 90, bedrooms: 3 });
    expect(r.low).toBeLessThan(r.estimate);
    expect(r.high).toBeGreaterThan(r.estimate);
    // Каждая граница округляется до тысяч отдельно, поэтому плечи могут
    // разойтись ровно на шаг округления — но не больше.
    const gapDown = r.estimate - r.low;
    const gapUp = r.high - r.estimate;
    expect(Math.abs(gapUp - gapDown)).toBeLessThanOrEqual(1000);
  });

  it('границы округлены до тысяч', () => {
    const r = valuation.estimate({ address: 'x', kind: 'HOUSE', area: 137, bedrooms: 3 });
    for (const v of [r.estimate, r.low, r.high]) expect(v % 1000).toBe(0);
  });

  it('возвращает арендную ставку и цену за метр', () => {
    const r = valuation.estimate({ address: 'x', kind: 'FLAT', area: 80, bedrooms: 2 });
    expect(r.pricePerM2).toBeGreaterThan(0);
    expect(r.rent).toBeGreaterThan(0);
    expect(r.rent).toBeLessThan(r.estimate / 100);
  });
});

describe('тарифы продвижения', () => {
  it('чем выше уровень, тем дороже', () => {
    expect(TARIFFS.BUMP.cents).toBeLessThan(TARIFFS.FEATURED.cents);
    expect(TARIFFS.FEATURED.cents).toBeLessThan(TARIFFS.TOP_AREA.cents);
  });

  it('совпадают с прайсом из бизнес-плана', () => {
    expect(TARIFFS.BUMP.cents).toBe(990);
    expect(TARIFFS.FEATURED.cents).toBe(1990);
    expect(TARIFFS.TOP_AREA.cents).toBe(3990);
  });

  it('подъём действует сутки, остальное — неделю', () => {
    expect(TARIFFS.BUMP.days).toBe(1);
    expect(TARIFFS.FEATURED.days).toBe(7);
    expect(TARIFFS.TOP_AREA.days).toBe(7);
  });
});
