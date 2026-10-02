import { PropertyKind } from '@prisma/client';

/** Единый вид объекта после разбора любого CRM-фида. */
export interface NormalizedListing {
  externalId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  kind: PropertyKind;
  price: number;
  /// Рыночная цена из фида. Без неё объект в выдачу не попадёт: обещание
  /// «дешевле рынка» нечем подтвердить.
  marketPrice: number | null;
  area: number;
  bedrooms: number;
  bathrooms: number;
  seaView: boolean;
  yearBuilt: number | null;
  features: string[];
  images: string[];
  /** Координаты: пин на карте поиска. */
  lat: number | null;
  lng: number | null;
  raw: unknown;
}

export interface FeedParseResult {
  items: NormalizedListing[];
  skipped: { externalId: string | null; reason: string }[];
}
