import { notFound } from 'next/navigation';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale } from '@/i18n/locales';
import { CabinetScreen } from '@/components/pro/CabinetScreen';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: `${dict.cabinet.title} — Casaya Pro` };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  return <CabinetScreen dict={dict} locale={locale} />;
}
