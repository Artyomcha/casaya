import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Защита от SSRF: фид — это адрес, который присылает агентство, и мы идём
 * по нему с нашего сервера. Без проверки это прямая дорога к внутренней сети
 * и к метаданным облака.
 *
 * Проверять строку адреса недостаточно сразу по нескольким причинам:
 * имя может указывать на внутренний IP, адрес бывает записан числом,
 * а публичная ссылка может увести редиректом на 169.254.169.254.
 * Поэтому здесь разрешается имя и проверяется каждый полученный адрес.
 */

/** Диапазоны, в которые ходить нельзя. Текстом — чтобы было видно, что закрыто. */
const BLOCKED_V4: [string, number][] = [
  ['0.0.0.0', 8], // текущая сеть
  ['10.0.0.0', 8], // частная
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // петля
  ['169.254.0.0', 16], // link-local, метаданные облака
  ['172.16.0.0', 12], // частная
  ['192.0.0.0', 24], // служебная IETF
  ['192.168.0.0', 16], // частная
  ['198.18.0.0', 15], // тесты производительности
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // зарезервировано
];

const toInt = (ip: string): number =>
  ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;

/** Попадает ли IPv4 в закрытый диапазон. */
export function isBlockedV4(ip: string): boolean {
  const value = toInt(ip);
  return BLOCKED_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (toInt(base) & mask);
  });
}

/** Попадает ли IPv6 в закрытый диапазон. */
export function isBlockedV6(ip: string): boolean {
  const value = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (value === '::' || value === '::1') return true;
  // Отображённые IPv4 проверяем как IPv4: ::ffff:127.0.0.1 — та же петля.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(value);
  if (mapped) return isBlockedV4(mapped[1]!);
  // fc00::/7 — уникальные локальные, fe80::/10 — link-local.
  return /^f[cd]/.test(value) || /^fe[89ab]/.test(value);
}

export const isBlockedAddress = (ip: string): boolean =>
  isIP(ip) === 6 ? isBlockedV6(ip) : isBlockedV4(ip);

export class UnsafeUrlError extends Error {}

/**
 * Проверяет адрес целиком: схему, имя и все адреса, в которые оно
 * разрешается. Пропуск внутренних адресов включается только для разработки.
 */
export async function assertPublicUrl(raw: string, allowPrivate = false): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('Некорректный адрес фида');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new UnsafeUrlError('Фид должен отдаваться по http или https');
  }
  if (allowPrivate) return url;

  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);

  if (!addresses.length) throw new UnsafeUrlError('Адрес фида не разрешается в IP');
  // Достаточно одного внутреннего адреса: какой из них выберет сокет,
  // мы не контролируем.
  if (addresses.some(isBlockedAddress)) {
    throw new UnsafeUrlError('Внутренние адреса не поддерживаются');
  }
  return url;
}
