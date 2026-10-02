export type Mode = 'buy' | 'rent';
export type PropertyKind = 'FLAT' | 'STUDIO' | 'PENTHOUSE' | 'HOUSE' | 'VILLA' | 'TOWNHOUSE' | 'COMMERCIAL';

export interface Agency {
  id: string;
  name: string;
  initials: string;
  brandColor: string;
  verified: boolean;
  replyTime: number;
}

/** Экономия против рыночной цены: в евро и в процентах. */
export interface Savings {
  amount: number;
  percent: number;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  address: string;
  city: string;
  kind: PropertyKind;
  price: number;
  /** Рыночная цена объекта — её указывает агентство вместе со своей. */
  marketPrice?: number | null;
  /** Насколько дешевле рынка. null — объекта в выдаче быть не должно. */
  savings?: Savings | null;
  area: number;
  bedrooms: number;
  bathrooms: number;
  seaView: boolean;
  seaDistance: string | null;
  yearBuilt: number | null;
  verified: boolean;
  badge: string | null;
  description: string;
  features: string[];
  coverImage: string;
  gallery: string[];
  lat: number | null;
  lng: number | null;
  videoTour: boolean;
  agency: Agency;
}

export interface Bank {
  id: string;
  name: string;
  initial: string;
  brandColor: string;
  rate: string;
}

export interface Filters {
  kind: 'all' | PropertyKind;
  maxPrice: number;
  bedrooms: number;
}

export const DEFAULT_FILTERS: Filters = { kind: 'all', maxPrice: 1_500_000, bedrooms: 0 };
export const NO_PRICE_LIMIT = 1_500_000;
