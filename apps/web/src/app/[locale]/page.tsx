import { notFound } from 'next/navigation';
import { HomeScreen } from '@/components/home/HomeScreen';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale } from '@/i18n/locales';
import { api, safe } from '@/lib/api';

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, listings, cities, services] = await Promise.all([
    getDictionary(locale),
    safe(api.listings({ take: 8 }), { items: [], total: 0 }),
    safe(api.cities(), []),
    safe(api.services('HOME'), []),
  ]);

  return (
    <HomeScreen
      dict={dict}
      locale={locale}
      listings={listings.items}
      cities={cities}
      services={services}
    />
  );
}
