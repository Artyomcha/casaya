import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale } from '@/i18n/locales';
import { ProScreen } from '@/components/pro/ProScreen';
import { api, safe } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: `Casaya Pro — ${dict.pro.title}`, description: dict.pro.lead };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, plans] = await Promise.all([getDictionary(locale), safe(api.plans(), [])]);

  return <ProScreen dict={dict} locale={locale} plans={plans} />;
}
