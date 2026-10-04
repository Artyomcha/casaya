import { token } from './session';
import type { Bank, Listing, OwnerDashboard, User, UserRole } from './types';

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
  // Токен подставляется сам: избранное и кабинет продавца закрыты, а
  // добавлять заголовок вручную в каждый вызов — верный способ забыть.
  const auth = token();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(auth ? { authorization: `Bearer ${auth}` } : null),
      ...(init?.headers ?? {}),
    },
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

  // --- Вход по одноразовому коду
  requestCode: (channel: 'phone' | 'email', identity: string) =>
    request<{ sent: boolean; expiresInSec: number; devCode?: string }>('/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ channel, identity }),
    }),
  verifyCode: (
    channel: 'phone' | 'email',
    identity: string,
    code: string,
    role: UserRole,
  ) =>
    request<{ token: string; user: User }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ channel, identity, code, role }),
    }),
  me: () => request<User>('/auth/me'),

  // --- Избранное покупателя. Хранится на сервере: отметки должны пережить
  // смену телефона, а не остаться в памяти одного устройства.
  favorites: () => request<{ listing: Listing }[]>('/favorites'),
  toggleFavorite: (listingId: string) =>
    request<{ active: boolean }>(`/favorites/${listingId}/toggle`, { method: 'POST' }),
  mergeFavorites: (listingIds: string[]) =>
    request<{ merged: number }>('/favorites/merge', {
      method: 'POST',
      body: JSON.stringify({ listingIds }),
    }),

  /** Кабинет продавца: его объекты и отклики по ним. */
  ownerDashboard: (userId: string) =>
    request<OwnerDashboard>(`/crm/owner/${userId}`),
};

export { API_URL };
