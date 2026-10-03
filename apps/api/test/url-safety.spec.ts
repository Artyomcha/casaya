import { describe, expect, it } from 'vitest';
import {
  assertPublicUrl,
  isBlockedAddress,
  isBlockedV4,
  isBlockedV6,
  UnsafeUrlError,
} from '../src/feeds/url-safety';

describe('закрытые адреса IPv4', () => {
  it('петля, частные сети и метаданные облака', () => {
    for (const ip of [
      '127.0.0.1',
      '127.1.1.1',
      '10.0.0.5',
      '172.16.0.1',
      '172.31.255.254',
      '192.168.1.1',
      '169.254.169.254',
      '0.0.0.0',
      '100.64.0.1',
    ]) {
      expect(isBlockedV4(ip), ip).toBe(true);
    }
  });

  it('172.32 уже публичный — диапазон 172.16/12, а не весь 172', () => {
    expect(isBlockedV4('172.32.0.1')).toBe(false);
    expect(isBlockedV4('172.15.255.255')).toBe(false);
  });

  it('обычные публичные адреса проходят', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34']) {
      expect(isBlockedV4(ip), ip).toBe(false);
    }
  });
});

describe('закрытые адреса IPv6', () => {
  it('петля, локальные и link-local', () => {
    for (const ip of ['::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1']) {
      expect(isBlockedV6(ip), ip).toBe(true);
    }
  });

  it('отображённый IPv4 проверяется как IPv4', () => {
    expect(isBlockedV6('::ffff:127.0.0.1')).toBe(true);
    expect(isBlockedV6('::ffff:8.8.8.8')).toBe(false);
  });

  it('публичный IPv6 проходит', () => {
    expect(isBlockedV6('2606:4700:4700::1111')).toBe(false);
  });
});

describe('проверка адреса фида', () => {
  const rejects = async (url: string) => {
    await expect(assertPublicUrl(url)).rejects.toBeInstanceOf(UnsafeUrlError);
  };

  it('схема только http и https', async () => {
    await rejects('file:///etc/passwd');
    await rejects('gopher://example.com/');
    await rejects('ftp://example.com/feed.xml');
  });

  it('мусор вместо адреса', async () => {
    await rejects('не адрес');
    await rejects('');
  });

  it('внутренние адреса закрыты', async () => {
    await rejects('http://127.0.0.1/feed.xml');
    await rejects('http://169.254.169.254/latest/meta-data/');
    await rejects('http://10.0.0.1/feed.xml');
    await rejects('http://[::1]/feed.xml');
  });

  it('адрес числом тоже закрыт — строковая проверка его пропускала', async () => {
    // 2130706433 — это 127.0.0.1, записанный одним числом.
    await rejects('http://2130706433/feed.xml');
  });

  it('имя, разрешающееся в петлю, закрыто — проверяется не строка, а IP', async () => {
    await rejects('http://localhost/feed.xml');
  });

  it('разрешение частных адресов включается явно, для разработки', async () => {
    const url = await assertPublicUrl('http://127.0.0.1:4100/feed.xml', true);
    expect(url.hostname).toBe('127.0.0.1');
  });
});

describe('isBlockedAddress выбирает проверку по версии', () => {
  it('различает IPv4 и IPv6', () => {
    expect(isBlockedAddress('10.1.2.3')).toBe(true);
    expect(isBlockedAddress('fe80::abcd')).toBe(true);
    expect(isBlockedAddress('8.8.4.4')).toBe(false);
  });
});
