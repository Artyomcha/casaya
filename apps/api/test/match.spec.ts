import { describe, expect, it } from 'vitest';
import {
  addressSimilarity,
  distanceMeters,
  geoCell,
  matchKey,
  MATCH_THRESHOLD,
  scoreMatch,
  type MatchCandidate,
} from '../src/properties/match';

/** Одна и та же квартира глазами двух разных агентств. */
const base: MatchCandidate = {
  address: 'Avenida del Mar 14, Puerto Banús, Marbella',
  city: 'Marbella',
  lat: 36.4876,
  lng: -4.9517,
  kind: 'FLAT',
  area: 80,
  bedrooms: 2,
  bathrooms: 2,
};

describe('расстояние', () => {
  it('считает по большому кругу', () => {
    // Марбелья — Эстепона: 0,0825° по широте (~9,2 км) и 0,259° по долготе
    // на широте 36,5° (~23,2 км) дают гипотенузу около 24,9 км.
    const d = distanceMeters(36.5095, -4.888, 36.427, -5.147);
    expect(d).toBeGreaterThan(24_400);
    expect(d).toBeLessThan(25_400);
  });

  it('даёт ноль для одной точки', () => {
    expect(distanceMeters(36.5, -4.9, 36.5, -4.9)).toBe(0);
  });
});

describe('схожесть адресов', () => {
  it('видит общие слова, игнорируя регистр и пунктуацию', () => {
    expect(addressSimilarity('Avenida del Mar 14, Marbella', 'AVDA. DEL MAR 14 — MARBELLA')).toBeGreaterThan(0.3);
  });

  it('не путает разные улицы', () => {
    expect(addressSimilarity('Calle Mayor 3, Altea', 'Gran Vía 88, Torrevieja')).toBe(0);
  });

  it('снимает диакритику', () => {
    expect(addressSimilarity('Ricardo Soriano, Marbella', 'Ricardo Soriano Marbella')).toBeGreaterThan(0.9);
  });
});

describe('ключи отбора кандидатов', () => {
  it('складывает близкие площади в одну корзину', () => {
    expect(matchKey({ ...base, area: 78 })).toBe(matchKey({ ...base, area: 82 }));
  });

  it('разводит разные типы объектов', () => {
    expect(matchKey(base)).not.toBe(matchKey({ ...base, kind: 'VILLA' }));
  });

  it('без координат ячейки нет', () => {
    expect(geoCell(null, null)).toBeNull();
    expect(geoCell(36.4876, -4.9517)).toBe('36488:-4952');
  });
});

describe('сопоставление объектов', () => {
  it('склеивает одну квартиру из двух фидов', () => {
    const other: MatchCandidate = {
      ...base,
      address: 'Avda. del Mar 14, Banús, Marbella',
      lat: 36.4877,
      lng: -4.9516,
      area: 81,
    };
    const { score } = scoreMatch(base, other);
    expect(score).toBeGreaterThan(MATCH_THRESHOLD);
  });

  it('кадастровый номер решает сам', () => {
    const a = { ...base, cadastralRef: '9872023VH5797S0001WX' };
    const b = { ...base, cadastralRef: '9872023vh5797s0001wx', address: 'совсем другой адрес', area: 300 };
    const { score, exact } = scoreMatch(a, b);
    expect(exact).toBe(true);
    expect(score).toBe(1);
  });

  it('разные кадастровые номера — разные объекты, даже если всё совпало', () => {
    const a = { ...base, cadastralRef: 'AAA' };
    const b = { ...base, cadastralRef: 'BBB' };
    expect(scoreMatch(a, b).score).toBe(0);
  });

  it('не склеивает квартиру с виллой', () => {
    expect(scoreMatch(base, { ...base, kind: 'VILLA' }).score).toBe(0);
  });

  it('не склеивает объекты с разной площадью', () => {
    expect(scoreMatch(base, { ...base, area: 120 }).score).toBe(0);
  });

  it('не склеивает соседние дома в 500 метрах', () => {
    expect(scoreMatch(base, { ...base, lat: 38.379 }).score).toBe(0);
  });

  it('разные этажи — разные квартиры', () => {
    const a = { ...base, floor: 3 };
    const b = { ...base, floor: 5 };
    expect(scoreMatch(a, b).score).toBe(0);
  });

  it('без координат опирается на адрес и не склеивает разные улицы', () => {
    const a: MatchCandidate = { ...base, lat: null, lng: null };
    const b: MatchCandidate = { ...base, lat: null, lng: null, address: 'Ricardo Soriano 88, Marbella' };
    expect(scoreMatch(a, b).score).toBeLessThan(MATCH_THRESHOLD);
  });

  it('возвращает разбор по признакам', () => {
    const { reasons } = scoreMatch(base, { ...base, area: 82 });
    expect(reasons).toHaveProperty('distance');
    expect(reasons).toHaveProperty('address');
    expect(reasons.area).toBeGreaterThan(0);
  });
});
