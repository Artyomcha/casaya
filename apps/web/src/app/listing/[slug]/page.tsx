import { notFound } from 'next/navigation';
import { ListingScreen } from '@/components/listing/ListingScreen';
import { api } from '@/lib/api';
import type { Metadata } from 'next';

async function load(slug: string) {
  try {
    return await api.listing(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const listing = await load(slug);
  if (!listing) return { title: 'Объект не найден — Casaya' };

  return {
    title: `${listing.title}, ${listing.address} — Casaya`,
    description: listing.description.slice(0, 200),
    openGraph: { images: [listing.coverImage] },
  };
}

// Каталог живой: объекты приезжают из фидов агентств постоянно.
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await load(slug);
  if (!listing) notFound();

  return <ListingScreen listing={listing} />;
}
