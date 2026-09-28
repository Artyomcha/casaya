import type { MetadataRoute } from 'next';
import { LOCALES, localePath } from '@/i18n/locales';
import { api, safe } from '@/lib/api';

const SITE = 'https://casaya.es';

/** Статические разделы портала — у каждого своя версия на каждом языке. */
const SECTIONS = ['', 'search', 'new', 'mortgage', 'services', 'value', 'pro', 'post'];

/**
 * Карта сайта с перекрёстными hreflang: по бизнес-плану мультиязычный SEO —
 * главный канал трафика, поэтому каждая страница объявляет все свои языки.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await safe(api.listings({ take: 100 }), { items: [], total: 0 });
  const paths = [...SECTIONS, ...listings.items.map((l) => `listing/${l.slug}`)];

  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${SITE}${localePath(locale, path)}`,
      lastModified: new Date(),
      changeFrequency: path.startsWith('listing/') ? ('daily' as const) : ('weekly' as const),
      priority: path === '' ? 1 : path.startsWith('listing/') ? 0.8 : 0.6,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${SITE}${localePath(l, path)}`]),
        ),
      },
    })),
  );
}
