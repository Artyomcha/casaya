import { ValueScreen } from '@/components/value/ValueScreen';
import { api, safe } from '@/lib/api';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Оценка недвижимости в Испании онлайн — Casaya',
  description: 'Автоматическая оценка по сделкам и проверенным объявлениям в вашем районе. Бесплатно и без регистрации.',
};

export default async function Page() {
  const listings = await safe(api.listings({ take: 5 }), { items: [], total: 0 });
  return <ValueScreen similar={listings.items.slice(2, 5)} />;
}
