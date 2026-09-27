import type { Bank, Listing } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4100/api';
const ASSETS_URL = process.env.EXPO_PUBLIC_ASSETS_URL ?? 'http://localhost:4100';

/**
 * Фото из агентских фидов приходят абсолютными ссылками на их CDN,
 * а демо-картинки лежат на нашем хосте относительным путём.
 */
export const imageUrl = (src: string): string =>
  /^https?:\/\//.test(src) ? src : `${ASSETS_URL}${src}`;

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string | string[] });
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(message ?? `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  listings: (params: { kinds?: string[]; maxPrice?: number; bedrooms?: number } = {}) => {
    const qs = new URLSearchParams({ take: '50' });
    if (params.kinds?.length) qs.set('kinds', params.kinds.join(','));
    if (params.maxPrice) qs.set('maxPrice', String(params.maxPrice));
    if (params.bedrooms) qs.set('bedrooms', String(params.bedrooms));
    return request<{ items: Listing[]; total: number }>(`/listings?${qs}`);
  },
  listing: (idOrSlug: string) => request<Listing>(`/listings/${idOrSlug}`),
  banks: () => request<Bank[]>('/banks'),
  createLead: (body: Record<string, unknown>) =>
    request<{ id: string }>('/leads', { method: 'POST', body: JSON.stringify(body) }),
};

export { API_URL };
