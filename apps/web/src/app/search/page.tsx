import { SearchScreen } from '@/components/search/SearchScreen';
import { api, safe } from '@/lib/api';
import type { ListingFilter, Mode } from '@/lib/types';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Поиск недвижимости в Аликанте — Casaya' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; filter?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const mode: Mode = sp.mode === 'rent' ? 'rent' : 'buy';
  const filter = (sp.filter ?? 'all') as ListingFilter;
  const q = sp.q ?? '';

  const [listings, pins] = await Promise.all([
    safe(api.listings({ filter, q }), { items: [], total: 0 }),
    safe(api.mapPins(), []),
  ]);

  return <SearchScreen listings={listings.items} pins={pins} mode={mode} query={q} />;
}
