export type Mode = 'buy' | 'rent' | 'new' | 'value';
export type ListingFilter = 'all' | 'flat' | 'house' | 'sea';
export type PropertyKind = 'FLAT' | 'HOUSE' | 'PENTHOUSE' | 'TOWNHOUSE' | 'COMMERCIAL';

export interface Agency {
  id: string;
  name: string;
  initials: string;
  brandColor: string;
  /** Логотип. Пусто — показываем инициалы на фирменном цвете. */
  logoUrl?: string | null;
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
  verifiedAt: string | null;
  badge: string | null;
  description: string;
  features: string[];
  coverImage: string;
  gallery: string[];
  /** Агентство, чьи снимки показаны в карточке. */
  photoCredit?: string;
  lat: number | null;
  lng: number | null;
  videoTour: boolean;
  agency: Agency;
  propertyId: string | null;
  /** Сколько агентств продают этот же объект, включая текущее. */
  offersCount?: number;
  /** Оплаченный показ — витрина обязана пометить его как рекламу. */
  promoted?: boolean;
  promotionTier?: PromotionTier;
}

export type PromotionTier = 'NONE' | 'BUMP' | 'FEATURED' | 'TOP_AREA';

export interface Offer {
  id: string;
  slug: string;
  title: string;
  price: number;
  verified: boolean;
  /** Это предложение оплачено как реклама. */
  promoted: boolean;
  agency: Agency;
}

export interface PropertyMedia {
  coverImage: string | null;
  gallery: string[];
  /** Агентство, чей набор признан лучшим. */
  source: string | null;
  /** Каждый кадр с указанием автора. */
  credits: { url: string; agencyName: string }[];
}

export interface PropertyOffers {
  media: PropertyMedia;
  property: { id: string; slug: string; address: string; area: number; bedrooms: number };
  offers: Offer[];
  count: number;
  promotedCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  /** Разброс цен между агентствами — то, чего на обычных порталах не видно. */
  spread: number;
}

export interface SimilarListing extends Listing {
  similarity: number;
  distanceMeters: number | null;
  promotionTier: PromotionTier;
}

export interface ListingCard extends Listing {
  href: string;
  priceLabel: string;
  /** Рыночная цена готовой строкой — её показываем зачёркнутой рядом с ценой. */
  marketLabel: string | null;
  subLabel: string;
  specs: string;
  agentInitials: string;
  dateLabel: string;
  offersCount: number;
  promoted: boolean;
}

export interface MapPin {
  id: string;
  slug: string;
  title: string;
  address: string;
  price: number;
  lat: number;
  lng: number;
  kind: PropertyKind;
  bedrooms: number;
  area: number;
  coverImage: string;
  verified: boolean;
}

/** Контур дома из испанского кадастра — им рисуется 3D-подсветка. */
export interface Footprint {
  found: boolean;
  parcelRef: string | null;
  cadastralAddress: string | null;
  floorsAbove: number | null;
  heightMeters: number | null;
  center: [number, number] | null;
  geojson: unknown | null;
  source: string | null;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  address: string;
  priceFrom: number;
  deliveryLabel: string;
  deliveryYear: string;
  developer: string;
  units: string;
  image: string;
  specs: { k: string; v: string }[];
  listings: { id: string; slug: string }[];
}

export interface City {
  id: string;
  slug: string;
  name: string;
  listingsCount: number;
  pricePerM2: number;
  image: string;
}

export interface Bank {
  id: string;
  name: string;
  initial: string;
  brandColor: string;
  rate: string;
  ltv: string;
  term: string;
  decisionTime: string;
}

export interface Plan {
  key: string;
  name: string;
  price: string;
  per: string;
  tag: string | null;
  items: string[];
  cta: string;
}

export interface ServiceOffer {
  id: string;
  slug: string;
  brand: string;
  title: string;
  description: string;
  price: string | null;
  bg: string;
  fg: string;
  icon: string;
  scope: 'HOME' | 'FULL';
}

export type FeedFormat = 'INMOVILLA' | 'WITEI' | 'MOBILIA' | 'KYERO' | 'RESALES' | 'CASAYA';
export type FeedStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ERROR';

export interface FeedRun {
  id: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  parsed: number;
  created: number;
  updated: number;
  archived: number;
  skipped: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface AgencyFeed {
  id: string;
  url: string;
  format: FeedFormat;
  status: FeedStatus;
  intervalMin: number;
  lastRunAt: string | null;
  lastOkAt: string | null;
  lastError: string | null;
  listingCount: number;
  runs?: FeedRun[];
  _count?: { listings: number };
}

export interface FeedPreview {
  format: FeedFormat;
  total: number;
  importable: number;
  skipped: { externalId: string | null; reason: string }[];
  sample: {
    externalId: string;
    title: string;
    address: string;
    price: number;
    area: number;
    bedrooms: number;
    bathrooms: number;
    images: number;
    cover: string | null;
  }[];
}

/** Причина, по которой объект не попадёт в выдачу. null — всё в порядке. */
export type PricingProblem = 'no-market-price' | 'not-below-market' | 'too-small' | 'too-big';

/** Строка кабинета: объект агентства с обеими ценами и состоянием витрины. */
export interface AgencyListing {
  id: string;
  slug: string;
  title: string;
  address: string;
  price: number;
  marketPrice: number | null;
  status: string;
  savings: Savings | null;
  pricingProblem: PricingProblem | null;
  visible: boolean;
}

export interface AgencyDashboard {
  agency: Agency & {
    plan: Plan | null;
    feeds: AgencyFeed[];
    crm: string | null;
    freeUntil: string | null;
  };
  inventory: { published: number; archived: number; verified: number; verifiedShare: number };
  feeds: AgencyFeed[];
  lastRun: FeedRun | null;
  leads: {
    id: string;
    kind: string;
    status: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
    listing: { id: string; slug: string; title: string } | null;
  }[];
  newLeads: number;
}

export interface CrmLead {
  id: string;
  status: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  budget: number | null;
  needsMortgage: boolean | null;
  contactedAt: string | null;
  nextStepAt: string | null;
  createdAt: string;
  listing: { id: string; slug: string; title: string; address: string; price: number } | null;
  assignee: { id: string; name: string | null } | null;
  notes: { id: string; text: string; createdAt: string }[];
}

export interface AnalyticsRow {
  id: string;
  slug: string;
  title: string;
  address: string;
  price: number;
  verified: boolean;
  coverImage: string;
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  favorites: number;
  promotion: { tier: PromotionTier; endsAt: string; area: string | null } | null;
}
