export type Mode = 'buy' | 'rent' | 'new' | 'value';
export type ListingFilter = 'all' | 'flat' | 'house' | 'sea';
export type PropertyKind = 'FLAT' | 'HOUSE' | 'PENTHOUSE' | 'TOWNHOUSE' | 'COMMERCIAL';

export interface Agency {
  id: string;
  name: string;
  initials: string;
  brandColor: string;
  verified: boolean;
  replyTime: number;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  address: string;
  city: string;
  kind: PropertyKind;
  price: number;
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
  mapX: string;
  mapY: string;
  videoTour: boolean;
  agency: Agency;
}

export interface ListingCard extends Listing {
  href: string;
  priceLabel: string;
  subLabel: string;
  specs: string;
  agentInitials: string;
  dateLabel: string;
}

export interface MapPin {
  id: string;
  slug: string;
  title: string;
  price: number;
  mapX: string;
  mapY: string;
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

export interface AgencyDashboard {
  agency: Agency & { plan: Plan | null; feeds: AgencyFeed[]; crm: string | null; freeUntil: string | null };
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
