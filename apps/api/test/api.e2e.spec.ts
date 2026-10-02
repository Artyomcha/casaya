import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Сквозные проверки по работающему API. Запускаются, если он поднят:
 * это проверка склейки всех слоёв, а не логики по отдельности.
 */
const BASE = process.env.API_URL ?? 'http://localhost:4100/api';

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
};

let alive = false;

beforeAll(async () => {
  alive = await fetch(`${BASE}/health`).then((r) => r.ok).catch(() => false);
  if (!alive) console.warn(`API на ${BASE} не отвечает — сквозные тесты пропущены`);
});

describe.skipIf(!process.env.CI && false)('каталог', () => {
  it('в обычной выдаче каждый объект встречается один раз', async () => {
    if (!alive) return;
    const d = await get<{ items: { propertyId: string; promoted: boolean }[]; collapsed: number }>('/listings');
    expect(d.items.length).toBeGreaterThan(0);
    expect(d.collapsed).toBeGreaterThan(0);

    // Оплаченные слоты стоят отдельно, поэтому уникальность проверяем
    // внутри органической части.
    const organic = d.items.filter((i) => !i.promoted).map((i) => i.propertyId).filter(Boolean);
    expect(new Set(organic).size).toBe(organic.length);
  });

  it('показывает, сколько агентств продают один объект', async () => {
    if (!alive) return;
    const d = await get<{ items: { offersCount: number }[] }>('/listings');
    expect(d.items.some((i) => i.offersCount > 1)).toBe(true);
  });

  it('по запросу возвращает дубли как есть', async () => {
    if (!alive) return;
    const collapsed = await get<{ total: number }>('/listings');
    const raw = await get<{ total: number }>('/listings?showDuplicates=true');
    expect(raw.total).toBeGreaterThan(collapsed.total);
  });

  it('фильтрует по типам через запятую', async () => {
    if (!alive) return;
    const d = await get<{ items: { kind: string }[] }>('/listings?kinds=VILLA,STUDIO');
    expect(d.items.every((i) => ['VILLA', 'STUDIO'].includes(i.kind))).toBe(true);
  });

  it('в debug-режиме отдаёт разбор ранжирования', async () => {
    if (!alive) return;
    const d = await get<{ items: { rank?: { score: number; breakdown: Record<string, number> } }[] }>(
      '/listings?debug=true&take=3',
    );
    // Разбор приходит для каждой карточки, включая оплаченные слоты.
    expect(d.items.every((i) => (i.rank?.score ?? 0) > 0)).toBe(true);
    expect(d.items[0]?.rank?.breakdown).toHaveProperty('quality');
  });

  it('сортирует обычную выдачу по убыванию веса', async () => {
    if (!alive) return;
    const d = await get<{ items: { promoted: boolean; rank?: { score: number } }[] }>('/listings?debug=true');
    // Порядок оплаченных слотов задаёт уровень покупки, а не вес.
    const scores = d.items.filter((i) => !i.promoted).map((i) => i.rank!.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });
});

describe('продвижение', () => {
  // Оплаченный показ — это дополнительная копия карточки наверху выдачи,
  // с ценой и условиями того агентства, которое заплатило.
  it('оплаченные слоты стоят выше обычной выдачи', async () => {
    if (!alive) return;
    const d = await get<{ items: { promoted: boolean }[]; promotedCount: number }>('/listings');
    expect(d.promotedCount).toBeGreaterThan(0);

    const firstOrganic = d.items.findIndex((i) => !i.promoted);
    expect(d.items.slice(0, firstOrganic).every((i) => i.promoted)).toBe(true);
    expect(d.items.slice(firstOrganic).every((i) => !i.promoted)).toBe(true);
  });

  it('в копии — цена и агентство того, кто заплатил', async () => {
    if (!alive) return;
    const d = await get<{ items: { id: string; promoted: boolean; price: number; agency: { name: string } }[] }>(
      '/listings',
    );
    const paid = d.items.find((i) => i.id === 'l3-dup-1');
    expect(paid?.promoted).toBe(true);
    expect(paid?.agency.name).toBe('Costa Living');
    expect(paid?.price).toBe(295_000);
  });

  it('объект остаётся и в обычной выдаче — копия его не заменяет', async () => {
    if (!alive) return;
    const listing = await get<{ propertyId: string }>('/listings/l3-dup-1');
    const d = await get<{ items: { id: string; propertyId: string; promoted: boolean }[] }>('/listings');

    const sameProperty = d.items.filter((i) => i.propertyId === listing.propertyId);
    expect(sameProperty.some((i) => i.promoted)).toBe(true);
    expect(sameProperty.some((i) => !i.promoted)).toBe(true);
  });

  it('органическая карточка — лучшая для покупателя, а не оплаченная', async () => {
    if (!alive) return;
    const listing = await get<{ propertyId: string }>('/listings/l3-dup-1');
    const d = await get<{ items: { propertyId: string; promoted: boolean; verified: boolean }[] }>('/listings');

    const organic = d.items.find((i) => i.propertyId === listing.propertyId && !i.promoted);
    expect(organic?.verified).toBe(true);
  });

  it('оплаченная карточка не зазывает к конкурентам', async () => {
    if (!alive) return;
    const d = await get<{ items: { promoted: boolean; offersCount: number }[] }>('/listings');
    // У рекламы счётчик агентств всегда единица, даже если объект продают трое.
    expect(d.items.filter((i) => i.promoted).every((i) => i.offersCount === 1)).toBe(true);
    // В обычной выдаче счётчик честный.
    expect(d.items.some((i) => !i.promoted && i.offersCount > 1)).toBe(true);
  });

  it('объявление знает, что оно оплачено', async () => {
    if (!alive) return;
    const paid = await get<{ promoted: boolean; promotionTier: string }>('/listings/l3-dup-1');
    const free = await get<{ promoted: boolean }>('/listings/l3');
    expect(paid.promoted).toBe(true);
    expect(paid.promotionTier).toBe('FEATURED');
    expect(free.promoted).toBe(false);
  });

  it('на странице объекта видны все предложения, оплаченные помечены', async () => {
    if (!alive) return;
    const listing = await get<{ propertyId: string }>('/listings/l3');
    const d = await get<{ count: number; promotedCount: number; offers: { promoted: boolean }[] }>(
      `/properties/${listing.propertyId}/offers`,
    );
    expect(d.count).toBe(3);
    expect(d.promotedCount).toBe(1);
    expect(d.offers.filter((o) => o.promoted)).toHaveLength(1);
  });
});

describe('дубли', () => {
  it('сводка считает скрытые карточки', async () => {
    if (!alive) return;
    const d = await get<{ properties: number; listings: number; hiddenDuplicates: number }>(
      '/listings/duplicate-stats',
    );
    expect(d.listings).toBeGreaterThan(d.properties);
    expect(d.hiddenDuplicates).toBe(d.listings - d.properties);
  });

  it('предложения по объекту отсортированы по цене', async () => {
    if (!alive) return;
    const listing = await get<{ propertyId: string }>('/listings/l3');
    const d = await get<{ offers: { price: number }[]; spread: number; count: number }>(
      `/properties/${listing.propertyId}/offers`,
    );
    expect(d.count).toBeGreaterThan(1);
    const prices = d.offers.map((o) => o.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    expect(d.spread).toBe(Math.max(...prices) - Math.min(...prices));
  });
});

describe('рекомендации', () => {
  it('не предлагают тот же объект от другого агентства', async () => {
    if (!alive) return;
    const base = await get<{ propertyId: string }>('/listings/l3');
    const similar = await get<{ id: string; propertyId: string; similarity: number }[]>('/listings/l3/similar');
    expect(similar.every((s) => s.propertyId !== base.propertyId)).toBe(true);
  });

  it('не показывают один объект дважды от разных агентств', async () => {
    if (!alive) return;
    const similar = await get<{ propertyId: string }[]>('/listings/l3/similar');
    const ids = similar.map((s) => s.propertyId).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('отсортированы по похожести и знают расстояние', async () => {
    if (!alive) return;
    const similar = await get<{ similarity: number; distanceMeters: number | null }[]>('/listings/l3/similar');
    if (!similar.length) return;
    const scores = similar.map((s) => s.similarity);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(similar[0].distanceMeters).not.toBeNull();
  });
});

describe('расчёты через API', () => {
  const post = async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return res.json() as Promise<T>;
  };

  it('ипотека считается так же, как на витрине', async () => {
    if (!alive) return;
    const r = await post<{ monthly: number }>('/mortgage/calculate', {
      price: 485_000,
      downPaymentPercent: 30,
      termYears: 25,
    });
    expect(r.monthly).toBe(1_645);
  });

  it('оценка возвращает диапазон', async () => {
    if (!alive) return;
    const r = await post<{ estimate: number; low: number; high: number }>('/valuation', {
      address: 'Calle Mayor 1',
      kind: 'FLAT',
      area: 90,
      bedrooms: 2,
    });
    expect(r.low).toBeLessThan(r.estimate);
    expect(r.high).toBeGreaterThan(r.estimate);
  });

  it('отклоняет некорректный ввод', async () => {
    if (!alive) return;
    const res = await fetch(`${BASE}/valuation`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address: 'x', kind: 'НЕ_ТИП', area: -5, bedrooms: 0 }),
    });
    expect(res.status).toBe(400);
  });
});

describe('CRM', () => {
  it('воронка разложена по стадиям', async () => {
    if (!alive) return;
    const agencies = await get<{ id: string; name: string }[]>('/agencies');
    const agency = agencies.find((a) => a.name === 'Marbella Prime') ?? agencies[0];
    const p = await get<{ columns: { status: string; leads: unknown[] }[]; total: number; conversion: number }>(
      `/crm/pipeline?agencyId=${agency.id}`,
    );
    expect(p.columns.map((c) => c.status)).toEqual(['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'WON', 'LOST']);
    expect(p.conversion).toBeGreaterThanOrEqual(0);
    expect(p.conversion).toBeLessThanOrEqual(1);
  });

  it('аналитика считает CTR', async () => {
    if (!alive) return;
    const agencies = await get<{ id: string }[]>('/agencies');
    const a = await get<{ totals: { impressions: number; clicks: number; ctr: number }; rows: unknown[] }>(
      `/crm/analytics?agencyId=${agencies[0].id}`,
    );
    expect(a.totals.impressions).toBeGreaterThan(0);
    expect(a.totals.ctr).toBeCloseTo(a.totals.clicks / a.totals.impressions, 6);
  });
});

describe('продвижение', () => {
  it('отдаёт прайс', async () => {
    if (!alive) return;
    const t = await get<{ tier: string; cents: number }[]>('/promotions/tariffs');
    expect(t.map((x) => x.tier)).toContain('TOP_AREA');
  });
});
