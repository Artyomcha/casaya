import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingScreen } from '@/components/listing/ListingScreen';
import { getDictionary } from '@/i18n/getDictionary';
import { isLocale, LOCALES, LOCALE_TAGS } from '@/i18n/locales';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function load(slug: string) {
  try {
    return await api.listing(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const [dict, listing] = await Promise.all([getDictionary(locale), load(slug)]);
  if (!listing) return { title: `${dict.listing.notFound} — Casaya` };

  return {
    title: `${listing.title}, ${listing.address} — Casaya`,
    description: listing.description.slice(0, 200),
    openGraph: { images: [listing.coverImage] },
    alternates: {
      canonical: `/${locale}/listing/${slug}`,
      languages: Object.fromEntries(
        LOCALES.map((l) => [LOCALE_TAGS[l], `/${l}/listing/${slug}`]),
      ),
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const [dict, listing] = await Promise.all([getDictionary(locale), load(slug)]);
  if (!listing) notFound();

  return <ListingScreen dict={dict} locale={locale} listing={listing} />;
}
