import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { FeedFormat } from '@prisma/client';
import { detectFormat, PARSERS } from './formats';
import { FeedParseResult, NormalizedListing } from './normalized';
import { assertPublicUrl, UnsafeUrlError } from './url-safety';

const MAX_BYTES = 64 * 1024 * 1024;
const TIMEOUT_MS = 30_000;
/** Больше трёх переходов у честного фида не бывает, а у ловушки — бывает. */
const MAX_REDIRECTS = 3;

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

  /**
   * Скачивает XML агентства. Разрешены только http(s) и только публичные
   * адреса — причём на каждом шаге: редиректы мы проходим сами, потому что
   * публичная ссылка умеет увести на 169.254.169.254 за метаданными облака.
   */
  async fetchXml(url: string): Promise<string> {
    const allowPrivate = process.env.FEED_ALLOW_PRIVATE === 'true';
    let target = await this.safeUrl(url, allowPrivate);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        const res = await fetch(target.toString(), {
          signal: controller.signal,
          headers: { 'user-agent': 'CasayaFeedBot/1.0 (+https://casaya.es/pro)' },
          redirect: 'manual',
        });

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get('location');
          if (!location) throw new BadRequestException('Фид ответил редиректом без адреса');
          if (hop === MAX_REDIRECTS) throw new BadRequestException('Слишком много редиректов');
          target = await this.safeUrl(new URL(location, target).toString(), allowPrivate);
          continue;
        }

        if (!res.ok) throw new BadRequestException(`Фид ответил ${res.status} ${res.statusText}`);

        const length = Number(res.headers.get('content-length') ?? 0);
        if (length > MAX_BYTES) throw new BadRequestException('Фид больше 64 МБ');

        return await this.readCapped(res);
      }
      throw new BadRequestException('Слишком много редиректов');
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new BadRequestException('Фид не ответил за 30 секунд');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private async safeUrl(raw: string, allowPrivate: boolean): Promise<URL> {
    try {
      return await assertPublicUrl(raw, allowPrivate);
    } catch (err) {
      if (err instanceof UnsafeUrlError) throw new BadRequestException(err.message);
      throw err;
    }
  }

  /**
   * Читает тело с ограничением по ходу чтения. Заголовку content-length
   * верить нельзя: его может не быть или он может врать, а res.text()
   * к тому моменту уже выкачает всё.
   */
  private async readCapped(res: Response): Promise<string> {
    const reader = res.body?.getReader();
    if (!reader) return res.text();

    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new BadRequestException('Фид больше 64 МБ');
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString('utf8');
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
