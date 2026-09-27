import { FavoritesScreen } from '@/components/favorites/FavoritesScreen';
import { api, safe } from '@/lib/api';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Избранное — Casaya' };

export default async function Page() {
  const listings = await safe(api.listings({ take: 100 }), { items: [], total: 0 });
  return <FavoritesScreen listings={listings.items} />;
}
