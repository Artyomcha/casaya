import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { FeedFormat } from '@prisma/client';
import { detectFormat, PARSERS } from './formats';
import { FeedParseResult, NormalizedListing } from './normalized';

const MAX_BYTES = 64 * 1024 * 1024;
const TIMEOUT_MS = 30_000;

@Injectable()
export class FeedFetcherService {
  private readonly logger = new Logger(FeedFetcherService.name);

  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    trimValues: true,
    parseTagValue: false,
    textNodeName: '#text',
  });

  /** Скачивает XML агентства. Разрешены только http(s) и только публичные адреса. */
  async fetchXml(url: string): Promise<string> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Некорректный адрес фида');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BadRequestException('Фид должен отдаваться по http или https');
    }
    // Внутренние адреса закрыты, чтобы фид агентства не стал вектором SSRF.
    // Локальная разработка и тесты снимают запрет через FEED_ALLOW_PRIVATE.
    const isPrivate = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|\[::1\]|::1$)/.test(parsed.hostname);
    if (isPrivate && process.env.FEED_ALLOW_PRIVATE !== 'true') {
      throw new BadRequestException('Внутренние адреса не поддерживаются');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(parsed.toString(), {
        signal: controller.signal,
        headers: { 'user-agent': 'CasayaFeedBot/1.0 (+https://casaya.es/pro)' },
        redirect: 'follow',
      });
      if (!res.ok) throw new BadRequestException(`Фид ответил ${res.status} ${res.statusText}`);

      const length = Number(res.headers.get('content-length') ?? 0);
      if (length > MAX_BYTES) throw new BadRequestException('Фид больше 64 МБ');

      const body = await res.text();
      if (body.length > MAX_BYTES) throw new BadRequestException('Фид больше 64 МБ');
      return body;
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new BadRequestException('Фид не ответил за 30 секунд');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Разбирает XML в нормализованные объекты, отбрасывая заведомо непригодные. */
  parse(xml: string, format?: FeedFormat): FeedParseResult & { format: FeedFormat } {
    let doc: any;
    try {
      doc = this.parser.parse(xml);
    } catch (err: any) {
      throw new BadRequestException(`Не удалось разобрать XML: ${err.message}`);
    }

    const resolved = format ?? detectFormat(doc);
    const items = PARSERS[resolved](doc);

    const good: NormalizedListing[] = [];
    const skipped: FeedParseResult['skipped'] = [];

    for (const item of items) {
      const reason = this.validate(item);
      if (reason) skipped.push({ externalId: item.externalId || null, reason });
      else good.push(item);
    }

    this.logger.log(`Разобрано ${good.length} объектов (${resolved}), пропущено ${skipped.length}`);
    return { format: resolved, items: good, skipped };
  }

  async fetchAndParse(url: string, format?: FeedFormat) {
    return this.parse(await this.fetchXml(url), format);
  }

  private validate(item: NormalizedListing): string | null {
    if (!item.externalId) return 'нет идентификатора объекта (ref / cod_ofer / id)';
    if (!item.price) return 'нет цены';
    if (!item.area) return 'нет площади';
    if (!item.images.length) return 'нет фотографий';
    if (!item.address) return 'нет адреса';
    return null;
  }
}
