import { describe, expect, it } from 'vitest';
import { canonicalMedia, photoSetScore, type PhotoSet } from '../src/properties/media';

const set = (over: Partial<PhotoSet> = {}): PhotoSet => ({
  listingId: 'l1',
  agencyName: 'Marbella Prime',
  coverImage: '/img/a-cover.jpg',
  gallery: ['/img/a-1.jpg', '/img/a-2.jpg', '/img/a-3.jpg'],
  verified: true,
  videoTour: true,
  ...over,
});

describe('качество набора фотографий', () => {
  it('проверенный объект весит больше непроверенного', () => {
    expect(photoSetScore(set({ verified: true }))).toBeGreaterThan(
      photoSetScore(set({ verified: false })),
    );
  });

  it('восемь кадров лучше двух', () => {
    const few = set({ gallery: ['/img/a-1.jpg'] });
    const many = set({ gallery: Array.from({ length: 7 }, (_, i) => `/img/a-${i}.jpg`) });
    expect(photoSetScore(many)).toBeGreaterThan(photoSetScore(few));
  });

  it('видео-тур добавляет вес', () => {
    expect(photoSetScore(set({ videoTour: true }))).toBeGreaterThan(
      photoSetScore(set({ videoTour: false })),
    );
  });

  it('полный набор набирает единицу', () => {
    const full = set({ gallery: Array.from({ length: 7 }, (_, i) => `/img/${i}.jpg`) });
    expect(photoSetScore(full)).toBeCloseTo(1, 5);
  });

  it('пустой набор без проверки даёт минимум', () => {
    const empty = set({ verified: false, videoTour: false, gallery: [] });
    expect(photoSetScore(empty)).toBeCloseTo(0.35 / 8, 5);
  });
});

describe('фотографии объекта из наборов трёх агентств', () => {
  const prime = set({
    listingId: 'l3',
    agencyName: 'Marbella Prime',
    coverImage: '/img/prime-cover.jpg',
    gallery: ['/img/prime-1.jpg', '/img/prime-2.jpg'],
    verified: true,
  });

  const norte = set({
    listingId: 'l3-a',
    agencyName: 'Casa Norte',
    coverImage: '/img/norte-cover.jpg',
    gallery: ['/img/norte-1.jpg'],
    verified: false,
    videoTour: false,
  });

  const costa = set({
    listingId: 'l3-b',
    agencyName: 'Costa Living',
    coverImage: '/img/costa-cover.jpg',
    gallery: ['/img/costa-1.jpg', '/img/costa-2.jpg'],
    verified: false,
    videoTour: false,
  });

  it('обложку берёт у лучшего набора', () => {
    const media = canonicalMedia([norte, costa, prime]);
    expect(media.coverImage).toBe('/img/prime-cover.jpg');
    expect(media.source).toBe('Marbella Prime');
  });

  it('обложка и галерея не перемешиваются между агентствами в начале', () => {
    const media = canonicalMedia([norte, costa, prime]);
    // Первыми идут кадры того же агентства, чья обложка.
    expect(media.gallery.slice(0, 2)).toEqual(['/img/prime-1.jpg', '/img/prime-2.jpg']);
  });

  it('в галерею попадают кадры всех агентств', () => {
    const media = canonicalMedia([norte, costa, prime]);
    expect(media.gallery).toContain('/img/norte-cover.jpg');
    expect(media.gallery).toContain('/img/costa-1.jpg');
  });

  it('у каждого кадра известен автор', () => {
    const media = canonicalMedia([norte, costa, prime]);
    const byUrl = new Map(media.credits.map((c) => [c.url, c.agencyName]));
    expect(byUrl.get('/img/prime-cover.jpg')).toBe('Marbella Prime');
    expect(byUrl.get('/img/norte-1.jpg')).toBe('Casa Norte');
    expect(byUrl.get('/img/costa-2.jpg')).toBe('Costa Living');
  });

  it('повторяющиеся адреса не дублируются', () => {
    const shared = set({ listingId: 'l3-c', agencyName: 'Sol', coverImage: '/img/prime-cover.jpg', gallery: ['/img/prime-1.jpg'] });
    const media = canonicalMedia([prime, shared]);
    const urls = [media.coverImage!, ...media.gallery];
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('обложка не повторяется внутри галереи', () => {
    const media = canonicalMedia([norte, costa, prime]);
    expect(media.gallery).not.toContain(media.coverImage);
  });

  it('без фотографий возвращает пустой результат', () => {
    const media = canonicalMedia([set({ coverImage: '', gallery: [] })]);
    expect(media.coverImage).toBeNull();
    expect(media.gallery).toEqual([]);
    expect(media.source).toBeNull();
  });

  it('единственное агентство даёт свой набор как есть', () => {
    const media = canonicalMedia([norte]);
    expect(media.coverImage).toBe('/img/norte-cover.jpg');
    expect(media.source).toBe('Casa Norte');
  });
});
