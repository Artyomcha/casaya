import { describe, expect, it } from 'vitest';
import {
  NEARBY_RADIUS_METERS,
  completenessScore,
  freshnessScore,
  medianPricePerM2,
  priceValueScore,
  PROMOTION_BOOST,
  responsivenessScore,
  scoreListing,
  similarityScore,
  WEIGHTS,
  type Rankable,
} from '../src/ranking/ranking';

const NOW = new Date('2026-09-28T12:00:00Z');

const listing = (over: Partial<Rankable> = {}): Rankable => ({
  id: 'l1',
  price: 289_000,
  area: 80,
  bedrooms: 2,
  kind: 'FLAT',
  seaView: true,
  verified: true,
  videoTour: true,
  publishedAt: NOW,
  photos: 8,
  descriptionLength: 600,
  lat: 38.3745,
  lng: -0.418,
  area_name: 'Playa de San Juan',
  agencyReplyTime: 10,
  promotionTier: 'NONE',
  ...over,
});

describe('веса', () => {
  it('в сумме дают единицу — score читается как доля', () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('продвижение не может перевесить качество', () => {
    // Даже максимальный буст слабее, чем один только бейдж Verificado.
    expect(Math.max(...Object.values(PROMOTION_BOOST))).toBeLessThan(WEIGHTS.verified);
  });
});

describe('свежесть', () => {
  it('у свежего объявления — единица', () => {
    expect(freshnessScore(NOW, NOW)).toBe(1);
  });

  it('через две недели падает вдвое', () => {
    const twoWeeks = new Date(NOW.getTime() - 14 * 86_400_000);
    expect(freshnessScore(twoWeeks, NOW)).toBeCloseTo(0.5, 5);
  });

  it('никогда не уходит в минус', () => {
    const ancient = new Date(NOW.getTime() - 3650 * 86_400_000);
    expect(freshnessScore(ancient, NOW)).toBeGreaterThanOrEqual(0);
  });
});

describe('полнота карточки', () => {
  it('пустая карточка даёт ноль', () => {
    expect(completenessScore(listing({ photos: 0, descriptionLength: 0, videoTour: false }))).toBe(0);
  });

  it('полная карточка даёт единицу', () => {
    expect(completenessScore(listing({ photos: 12, descriptionLength: 900 }))).toBeCloseTo(1, 5);
  });

  it('фотографии весят больше, чем видео-тур', () => {
    const withPhotos = completenessScore(listing({ photos: 8, descriptionLength: 0, videoTour: false }));
    const withVideo = completenessScore(listing({ photos: 0, descriptionLength: 0, videoTour: true }));
    expect(withPhotos).toBeGreaterThan(withVideo);
  });
});

describe('выгодность цены', () => {
  const median = 3_600;

  it('дешевле медианы — выше балл', () => {
    const cheap = priceValueScore(listing({ price: 230_000 }), median);
    const pricey = priceValueScore(listing({ price: 360_000 }), median);
    expect(cheap).toBeGreaterThan(pricey);
  });

  it('на медиане даёт середину', () => {
    expect(priceValueScore(listing({ price: median * 80 }), median)).toBeCloseTo(0.5, 1);
  });

  it('без данных о медиане не штрафует', () => {
    expect(priceValueScore(listing(), 0)).toBe(0.5);
  });

  it('остаётся в диапазоне 0..1 на любых входных данных', () => {
    for (const price of [1, 50_000, 10_000_000]) {
      const v = priceValueScore(listing({ price }), median);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('скорость ответа', () => {
  it('десять минут — максимум', () => expect(responsivenessScore(10)).toBe(1));
  it('час — ноль', () => expect(responsivenessScore(60)).toBe(0));
  it('не уходит за границы', () => expect(responsivenessScore(600)).toBe(0));
});

describe('медиана цены за м²', () => {
  it('на нечётном наборе берёт середину', () => {
    expect(medianPricePerM2([{ price: 100, area: 1 }, { price: 300, area: 1 }, { price: 200, area: 1 }])).toBe(200);
  });

  it('на чётном усредняет два средних', () => {
    expect(medianPricePerM2([{ price: 100, area: 1 }, { price: 200, area: 1 }])).toBe(150);
  });

  it('игнорирует объекты без площади', () => {
    expect(medianPricePerM2([{ price: 100, area: 0 }, { price: 200, area: 1 }])).toBe(200);
  });

  it('на пустом наборе даёт ноль', () => expect(medianPricePerM2([])).toBe(0));
});

describe('итоговое ранжирование', () => {
  const ctx = { medianPricePerM2: 3_600, now: NOW };

  it('проверенный объект обходит непроверенный при прочих равных', () => {
    const a = scoreListing(listing({ verified: true }), ctx).score;
    const b = scoreListing(listing({ id: 'l2', verified: false }), ctx).score;
    expect(a).toBeGreaterThan(b);
  });

  it('продвижение поднимает объявление', () => {
    const plain = scoreListing(listing(), ctx).score;
    const boosted = scoreListing(listing({ promotionTier: 'FEATURED' }), ctx).score;
    expect(boosted - plain).toBeCloseTo(PROMOTION_BOOST.FEATURED, 10);
  });

  it('купленный буст не вытаскивает мусорное объявление выше хорошего', () => {
    const good = scoreListing(listing(), ctx).score;
    const junk = scoreListing(
      listing({
        id: 'junk',
        verified: false,
        photos: 0,
        descriptionLength: 0,
        videoTour: false,
        agencyReplyTime: 90,
        promotionTier: 'TOP_AREA',
      }),
      ctx,
    ).score;
    expect(junk).toBeLessThan(good);
  });

  it('Top района работает только в своём районе', () => {
    const item = listing({ promotionTier: 'TOP_AREA', area_name: 'Playa de San Juan' });
    const inside = scoreListing(item, { ...ctx, area: 'Playa de San Juan' }).score;
    const outside = scoreListing(item, { ...ctx, area: 'Gran Vía' }).score;
    expect(inside - outside).toBeCloseTo(PROMOTION_BOOST.TOP_AREA, 10);
  });

  it('отдаёт разбор по слагаемым', () => {
    const { breakdown } = scoreListing(listing({ promotionTier: 'BUMP' }), ctx);
    expect(breakdown.quality).toBeGreaterThan(0);
    expect(breakdown.promotion).toBe(PROMOTION_BOOST.BUMP);
  });
});

describe('похожесть для рекомендаций', () => {
  it('объект не похож сам на себя', () => {
    expect(similarityScore(listing(), listing()).score).toBe(0);
  });

  it('соседний похожий объект набирает много', () => {
    const near = listing({ id: 'l2', lat: 38.3755, lng: -0.4185, price: 295_000 });
    expect(similarityScore(listing(), near).score).toBeGreaterThan(0.8);
  });

  it('соседний городок в пяти километрах — ещё рекомендация', () => {
    const nextTown = listing({ id: 'l3', lat: 38.42, lng: -0.418 });
    expect(similarityScore(listing(), nextTown).score).toBeGreaterThan(0);
  });

  it('за пределом радиуса — уже нет', () => {
    // Торревьеха от Сан-Хуана — около 45 км.
    const far = listing({ id: 'l4', lat: 38.0164, lng: -0.6664 });
    expect(similarityScore(listing(), far).score).toBe(0);
    expect(NEARBY_RADIUS_METERS).toBe(12_000);
  });

  it('возвращает расстояние в метрах', () => {
    const near = listing({ id: 'l2', lat: 38.3755, lng: -0.418 });
    const { distance } = similarityScore(listing(), near);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(130);
  });

  it('вилла за ту же цену похожа меньше, чем квартира', () => {
    const flat = listing({ id: 'a', lat: 38.3750, lng: -0.4181 });
    const villa = listing({ id: 'b', lat: 38.3750, lng: -0.4181, kind: 'VILLA' });
    expect(similarityScore(listing(), flat).score).toBeGreaterThan(
      similarityScore(listing(), villa).score,
    );
  });
});
