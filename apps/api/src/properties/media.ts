/** Набор фотографий одного агентства по объекту. */
export interface PhotoSet {
  listingId: string;
  agencyName: string;
  coverImage: string;
  gallery: string[];
  /** Объект прошёл проверку Casaya — значит съёмка велась по чек-листу. */
  verified: boolean;
  videoTour: boolean;
}

/**
 * Насколько хорош набор фотографий.
 *
 * Проверенный объект весит больше всего: там съёмка шла по нашему чек-листу —
 * комнаты, вид из окна, подъезд, двор. Дальше считает количество снимков:
 * восемь кадров дают полную картину, два — нет. Видео-тур добавляет сверху.
 */
export function photoSetScore(set: PhotoSet): number {
  const count = Math.min(1, (1 + set.gallery.length) / 8);
  return 0.45 * (set.verified ? 1 : 0) + 0.35 * count + 0.2 * (set.videoTour ? 1 : 0);
}

export interface CanonicalMedia {
  coverImage: string | null;
  gallery: string[];
  /** Агентство, чей набор признан лучшим. */
  source: string | null;
  /** Каждый снимок с указанием агентства — для подписи авторства. */
  credits: { url: string; agencyName: string }[];
}

/**
 * Собирает фотографии объекта из наборов всех агентств.
 *
 * Обложку берём из лучшего набора целиком: смешивать обложку одного агентства
 * с галереей другого нельзя — ракурсы и обработка не сойдутся, карточка будет
 * выглядеть склеенной. А вот галерею объединяем: покупателю полезно увидеть
 * квартиру со всех ракурсов, которые вообще кто-то снял.
 *
 * Повторы убираются по адресу файла. Одинаковые кадры, выгруженные под
 * разными адресами, так не поймать — для этого нужен перцептивный хеш
 * самих изображений, а их мы не скачиваем.
 */
export function canonicalMedia(sets: PhotoSet[]): CanonicalMedia {
  const usable = sets.filter((s) => s.coverImage);
  if (!usable.length) return { coverImage: null, gallery: [], source: null, credits: [] };

  const best = [...usable].sort((a, b) => photoSetScore(b) - photoSetScore(a))[0];

  const seen = new Set<string>();
  const credits: { url: string; agencyName: string }[] = [];

  // Сначала кадры лучшего набора — они задают порядок галереи.
  const ordered = [best, ...usable.filter((s) => s.listingId !== best.listingId)];
  for (const set of ordered) {
    for (const url of [set.coverImage, ...set.gallery]) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      credits.push({ url, agencyName: set.agencyName });
    }
  }

  return {
    coverImage: best.coverImage,
    gallery: credits.map((c) => c.url).filter((url) => url !== best.coverImage),
    source: best.agencyName,
    credits,
  };
}
