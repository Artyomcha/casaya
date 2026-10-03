import { beforeAll, describe, expect, it } from 'vitest';
import { BASE, liveApi } from './live-api';

/**
 * Проверка доступа на живом API. Кабинет агентства и CRM должны быть закрыты:
 * до этих guard'ов любой, кто знал идентификатор, мог переписать чужие цены.
 */

let alive = false;
let agencyId = '';

beforeAll(async () => {
  alive = await liveApi();
  if (!alive) return;

  const listings = (await fetch(`${BASE}/listings?take=1`).then((r) => r.json())) as {
    items: { agency: { id: string } }[];
  };
  agencyId = listings.items[0]!.agency.id;
});

/** Вход по одноразовому коду: в dev-режиме код возвращается самим API. */
async function signIn(email: string): Promise<string> {
  const requested = (await fetch(`${BASE}/auth/request-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'email', identity: email }),
  }).then((r) => r.json())) as { devCode?: string };

  const verified = (await fetch(`${BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'email', identity: email, code: requested.devCode }),
  }).then((r) => r.json())) as { token: string };

  return verified.token;
}

const status = (path: string, init?: RequestInit) =>
  fetch(`${BASE}${path}`, init).then((r) => r.status);

describe('кабинет агентства закрыт', () => {
  it('без токена — 401', async () => {
    if (!alive) return;
    expect(await status(`/agencies/${agencyId}/listings`)).toBe(401);
    expect(await status(`/agencies/${agencyId}/dashboard`)).toBe(401);
  });

  it('цены чужого агентства не поменять даже с токеном — 403', async () => {
    if (!alive) return;
    const token = await signIn(`postoronniy-${Date.now()}@example.com`);

    expect(
      await status(`/agencies/${agencyId}/listings`, {
        headers: { authorization: `Bearer ${token}` },
      }),
    ).toBe(403);

    expect(
      await status(`/agencies/${agencyId}/listings/l6/pricing`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ price: 1000, marketPrice: 999_000 }),
      }),
    ).toBe(403);
  });

  it('подделанный токен не проходит', async () => {
    if (!alive) return;
    expect(
      await status(`/agencies/${agencyId}/listings`, {
        headers: { authorization: 'Bearer ZmFrZQ.badsignature' },
      }),
    ).toBe(401);
  });
});

describe('CRM закрыта', () => {
  it('воронка и аналитика чужого агентства недоступны', async () => {
    if (!alive) return;
    expect(await status(`/crm/pipeline?agencyId=${agencyId}`)).toBe(401);
    expect(await status(`/crm/analytics?agencyId=${agencyId}`)).toBe(401);
  });

  it('чужой кабинет собственника недоступен', async () => {
    if (!alive) return;
    const token = await signIn(`owner-${Date.now()}@example.com`);
    expect(
      await status('/crm/owner/someone-else', {
        headers: { authorization: `Bearer ${token}` },
      }),
    ).toBe(403);
  });
});

describe('витрина осталась открытой', () => {
  it('выдача, карточка и пины не требуют входа', async () => {
    if (!alive) return;
    expect(await status('/listings')).toBe(200);
    expect(await status('/listings/map-pins')).toBe(200);
    expect(await status('/cities')).toBe(200);
  });

  it('показы и клики шлёт неизвестный посетитель', async () => {
    if (!alive) return;
    const code = await status('/crm/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: 'l6', placement: 'SEARCH', field: 'impressions' }),
    });
    expect(code).toBeLessThan(400);
  });
});
