import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale } from '@/i18n/locales';
import { SearchScreen } from '@/components/search/SearchScreen';
import { api, safe } from '@/lib/api';
import type { ListingFilter, Mode } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: `${dict.search.titleBuy} — Casaya` };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string; filter?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const sp = await searchParams;
  const mode: Mode = sp.mode === 'rent' ? 'rent' : 'buy';
  const filter = (sp.filter ?? 'all') as ListingFilter;
  const q = sp.q ?? '';

  const [dict, listings, pins] = await Promise.all([
    getDictionary(locale),
    safe(api.listings({ filter, q }), { items: [], total: 0 }),
    safe(api.mapPins(), []),
  ]);

  return (
    <SearchScreen
      dict={dict}
      locale={locale}
      listings={listings.items}
      pins={pins}
      mode={mode}
      query={q}
    />
  );
}
