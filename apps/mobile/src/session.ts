import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Токен входа. Хранится отдельно от состояния приложения, потому что его
 * читает и клиент API — иначе пришлось бы добавлять заголовок вручную
 * в каждый вызов, а это верный способ однажды забыть.
 */
const TOKEN_KEY = 'casaya:token';

let cached: string | null = null;

export function token(): string | null {
  return cached;
}

/** Читается один раз при старте: дальше токен живёт в памяти. */
export async function restoreToken(): Promise<string | null> {
  try {
    cached = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    cached = null;
  }
  return cached;
}

export async function setToken(value: string): Promise<void> {
  cached = value;
  await AsyncStorage.setItem(TOKEN_KEY, value).catch(() => {
    /* не сохранилось — вход всё равно действует в этой сессии */
  });
}

export async function clearToken(): Promise<void> {
  cached = null;
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {
    /* хранилище недоступно */
  });
}
