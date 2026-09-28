import type {
  AnalyticsRow,
  CrmLead,
  PropertyOffers,
  SimilarListing,
  AgencyDashboard,
  AgencyFeed,
  Bank,
  City,
  FeedPreview,
  Listing,
  ListingFilter,
  MapPin,
  Plan,
  Project,
  ServiceOffer,
} from './types';

const SERVER_BASE = process.env.API_URL ?? 'http://localhost:4100/api';
export const CLIENT_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4100/api';

const base = () => (typeof window === 'undefined' ? SERVER_BASE : CLIENT_BASE);

const ASSETS_BASE = (process.env.NEXT_PUBLIC_ASSETS_URL ?? CLIENT_BASE.replace(/\/api$/, ''));

/** Загруженные файлы лежат на хосте API, data-URI отдаются как есть. */
export const imageUrl = (src: string): string =>
  /^(https?:|data:)/.test(src) ? src : `${ASSETS_BASE}${src}`;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    cache: init?.method && init.method !== 'GET' ? 'no-store' : 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(message ?? `${res.status} ${res.statusText}`, res.status);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  listings: (params: { filter?: ListingFilter; q?: string; verifiedOnly?: boolean; take?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.filter) qs.set('filter', params.filter);
    if (params.q) qs.set('q', params.q);
    if (params.verifiedOnly) qs.set('verifiedOnly', 'true');
    if (params.take) qs.set('take', String(params.take));
    const suffix = qs.toString();
    return request<{ items: Listing[]; total: number }>(`/listings${suffix ? `?${suffix}` : ''}`);
  },
  listing: (idOrSlug: string) => request<Listing>(`/listings/${idOrSlug}`),
  similar: (idOrSlug: string) => request<SimilarListing[]>(`/listings/${idOrSlug}/similar`),
  offers: (propertyId: string) => request<PropertyOffers>(`/properties/${propertyId}/offers`),
  duplicateStats: () =>
    request<{ properties: number; listings: number; duplicatedProperties: number; hiddenDuplicates: number; share: number }>(
      '/listings/duplicate-stats',
    ),
  pipeline: (agencyId: string) =>
    request<{ columns: { status: string; leads: CrmLead[] }[]; total: number; conversion: number; overdue: number }>(
      `/crm/pipeline?agencyId=${agencyId}`,
    ),
  crmAnalytics: (agencyId: string) =>
    request<{ totals: { impressions: number; clicks: number; leads: number; ctr: number }; rows: AnalyticsRow[] }>(
      `/crm/analytics?agencyId=${agencyId}`,
    ),
  moveLead: (id: string, status: string) =>
    request<CrmLead>(`/crm/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  promotionTariffs: () => request<{ tier: string; cents: number; days: number; label: string }[]>('/promotions/tariffs'),
  buyPromotion: (listingId: string, tier: string) =>
    post<{ id: string; tier: string; endsAt: string }>('/promotions', { listingId, tier }),
  mapPins: () => request<MapPin[]>('/listings/map-pins'),
  projects: (year?: string) => request<Project[]>(`/projects${year && year !== 'all' ? `?year=${year}` : ''}`),
  cities: () => request<City[]>('/cities'),
  banks: () => request<Bank[]>('/banks'),
  plans: () => request<Plan[]>('/plans'),
  services: (scope?: 'HOME' | 'FULL') => request<ServiceOffer[]>(`/services${scope ? `?scope=${scope}` : ''}`),

  createLead: (body: Record<string, unknown>) => post<{ id: string }>('/leads', body),
  valuation: (body: { address: string; kind: string; area: number; bedrooms: number }) =>
    post<{ estimate: number; low: number; high: number; pricePerM2: number; rent: number; dealsNearby: number }>(
      '/valuation',
      body,
    ),

  registerAgency: (body: Record<string, unknown>) => post<{ id: string; name: string }>('/agencies/register', body),
  agencyDashboard: (id: string) => request<AgencyDashboard>(`/agencies/${id}/dashboard`),

  previewFeed: (body: { url: string; format?: string }) => post<FeedPreview>('/feeds/preview', body),
  connectFeed: (body: { agencyId: string; url: string; format?: string; intervalMin?: number }) =>
    post<AgencyFeed>('/feeds', body),
  syncFeed: (id: string) => post<{ parsed: number; created: number; updated: number }>(`/feeds/${id}/sync`, {}),
  feeds: (agencyId: string) => request<AgencyFeed[]>(`/feeds?agencyId=${agencyId}`),
};

/** Каталог должен рисоваться даже когда API недоступен — страница не падает целиком. */
export async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.error('[casaya] API недоступен:', (err as Error).message);
    return fallback;
  }
}
