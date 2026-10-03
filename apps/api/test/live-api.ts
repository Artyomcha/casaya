/**
 * Сквозные тесты ходят в поднятый API. Локально его может не быть, и тогда
 * они пропускаются — но тихий пропуск опасен: прогон зелёный, а проверено
 * ничего. В CI переменная REQUIRE_API=1 превращает пропуск в падение.
 */
export const BASE = process.env.API_URL ?? 'http://localhost:4100/api';

export async function liveApi(): Promise<boolean> {
  const alive = await fetch(`${BASE}/health`)
    .then((r) => r.ok)
    .catch(() => false);

  if (alive) return true;

  if (process.env.REQUIRE_API === '1') {
    throw new Error(
      `API на ${BASE} не отвечает, а REQUIRE_API=1. Сквозные тесты обязаны выполниться.`,
    );
  }

  console.warn(`API на ${BASE} не отвечает — сквозные тесты пропущены`);
  return false;
}
