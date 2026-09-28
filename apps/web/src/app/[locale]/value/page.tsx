import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale } from '@/i18n/locales';
import { ValueScreen } from '@/components/value/ValueScreen';
import { api, safe } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: `${dict.valuation.title} — Casaya`, description: dict.valuation.lead };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, listings] = await Promise.all([
    getDictionary(locale),
    safe(api.listings({ take: 5 }), { items: [], total: 0 }),
  ]);

  return <ValueScreen dict={dict} locale={locale} similar={listings.items.slice(2, 5)} />;
}
