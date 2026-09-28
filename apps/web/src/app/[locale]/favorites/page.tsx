import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale } from '@/i18n/locales';
import { FavoritesScreen } from '@/components/favorites/FavoritesScreen';
import { api, safe } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: `${dict.favorites.title} — Casaya` };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, listings] = await Promise.all([
    getDictionary(locale),
    safe(api.listings({ take: 100 }), { items: [], total: 0 }),
  ]);

  return <FavoritesScreen dict={dict} locale={locale} listings={listings.items} />;
}
