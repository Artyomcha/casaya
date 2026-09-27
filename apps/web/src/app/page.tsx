import { HomeScreen } from '@/components/home/HomeScreen';
import { api, safe } from '@/lib/api';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const [listings, cities, services] = await Promise.all([
    safe(api.listings({ take: 8 }), { items: [], total: 0 }),
    safe(api.cities(), []),
    safe(api.services('HOME'), []),
  ]);

  return <HomeScreen listings={listings.items} cities={cities} services={services} />;
}
