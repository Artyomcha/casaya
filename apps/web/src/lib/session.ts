'use client';

/**
 * Сессия портала: токен входа лежит в localStorage.
 *
 * Отдельный модуль, потому что к токену обращаются и запросы к API, и экраны:
 * кабинет агентства без входа просто не открывается.
 */
const TOKEN_KEY = 'casaya:token';

export function token(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // Приватный режим: вход в этой вкладке просто не сохранится.
    return null;
  }
}

export function setToken(value: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, value);
    window.dispatchEvent(new Event('casaya:session'));
  } catch {
    /* приватный режим */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('casaya:session'));
  } catch {
    /* приватный режим */
  }
}
