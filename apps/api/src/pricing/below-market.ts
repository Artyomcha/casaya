/**
 * «Ниже рынка» — главное обещание Casaya. Агент указывает две цены:
 * рыночную (по которой объект идёт обычно) и свою на Casaya. Разницу
 * считаем мы, и объект держится в выдаче только пока она есть.
 *
 * Здесь только арифметика и правило допуска — без базы, чтобы граница
 * между «показываем» и «не показываем» была в одном месте и под тестами.
 */

/**
 * Насколько именно ниже — дело агентства: оно платит за показ и само решает,
 * чем привлекать покупателя. Порога у витрины нет, правило одно: ниже рынка.
 *
 * Скидка больше половины — почти всегда опечатка в нулях. Объект из-за неё
 * не прячется, но кабинет про неё предупреждает: цена с лишним нулём ударит
 * по агентству сильнее, чем по нам.
 */
export const SUSPICIOUS_DISCOUNT_PERCENT = 50;

export interface Savings {
  /** Сколько покупатель экономит в евро. */
  amount: number;
  /** На сколько процентов ниже рынка, с одним знаком после запятой. */
  percent: number;
}

/**
 * Разница между рыночной ценой и ценой на Casaya.
 * null — экономии нет: рыночная цена не указана или не выше нашей.
 */
export function savingsOf(price: number, marketPrice: number | null | undefined): Savings | null {
  if (marketPrice == null || !Number.isFinite(marketPrice) || !Number.isFinite(price)) return null;
  if (marketPrice <= 0 || price <= 0 || marketPrice <= price) return null;

  const amount = marketPrice - price;
  return { amount, percent: Math.round((amount / marketPrice) * 1000) / 10 };
}

/**
 * Попадает ли объект в выдачу. Проверяется на каждом показе, а не один раз
 * при заливке: поднял агент цену до рыночной — объект уходит сам.
 */
export function belowMarket(price: number, marketPrice: number | null | undefined): boolean {
  return savingsOf(price, marketPrice) != null;
}

export type PricingProblem = 'no-market-price' | 'not-below-market';

/**
 * Почему объект не попадёт в выдачу — для кабинета агентства.
 * null означает, что всё в порядке.
 */
export function pricingProblem(
  price: number,
  marketPrice: number | null | undefined,
): PricingProblem | null {
  if (marketPrice == null) return 'no-market-price';
  return savingsOf(price, marketPrice) ? null : 'not-below-market';
}

/** Похоже на опечатку в нулях: объект не прячем, но кабинет предупреждает. */
export function suspiciousDiscount(
  price: number,
  marketPrice: number | null | undefined,
): boolean {
  const savings = savingsOf(price, marketPrice);
  return savings != null && savings.percent > SUSPICIOUS_DISCOUNT_PERCENT;
}
