import { notFound } from 'next/navigation';
import { CrmBoard } from '@/components/pro/CrmBoard';
import { isLocale } from '@/i18n/locales';

export const metadata = { title: 'CRM — Casaya Pro' };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <CrmBoard locale={locale} />;
}
