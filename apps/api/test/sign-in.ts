import { BASE } from './live-api';

/**
 * Вход для тестов. Токены кэшируются по адресу: запрос кода ограничен
 * пятью обращениями в минуту, и каждый тест со своим входом упирался
 * в этот лимит — проверялся бы не доступ, а ограничение частоты.
 */
const cache = new Map<string, Promise<string>>();

export function signIn(email: string): Promise<string> {
  const existing = cache.get(email);
  if (existing) return existing;

  const promise = (async () => {
    const requested = (await fetch(`${BASE}/auth/request-code`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channel: 'email', identity: email }),
    }).then((r) => r.json())) as { devCode?: string; message?: string };

    if (!requested.devCode) {
      throw new Error(`Код не пришёл для ${email}: ${requested.message ?? 'без причины'}`);
    }

    const verified = (await fetch(`${BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ channel: 'email', identity: email, code: requested.devCode }),
    }).then((r) => r.json())) as { token?: string; message?: string };

    if (!verified.token) {
      throw new Error(`Вход не прошёл для ${email}: ${verified.message ?? 'без причины'}`);
    }
    return verified.token;
  })();

  cache.set(email, promise);
  return promise;
}
