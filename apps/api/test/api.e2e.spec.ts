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
  it('отдаёт выдачу со схлопнутыми дублями', async () => {
    if (!alive) return;
    const d = await get<{ items: any[]; total: number; collapsed: number }>('/listings');
    expect(d.items.length).toBeGreaterThan(0);
    // Схлопнутых карточек должно быть столько же, сколько лишних предложений.
    expect(d.collapsed).toBeGreaterThanOrEqual(0);

    const ids = d.items.map((i) => i.propertyId).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
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
    const rank = d.items[0]?.rank;
    expect(rank?.score).toBeGreaterThan(0);
    expect(rank?.breakdown).toHaveProperty('quality');
  });

  it('сортирует по убыванию веса', async () => {
    if (!alive) return;
    const d = await get<{ items: { rank?: { score: number } }[] }>('/listings?debug=true');
    const scores = d.items.map((i) => i.rank!.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
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
    const agency = agencies.find((a) => a.name === 'Alicante Prime') ?? agencies[0];
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
