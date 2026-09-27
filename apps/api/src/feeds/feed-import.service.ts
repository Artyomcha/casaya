import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AgencyFeed, FeedRunStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedFetcherService } from './feed-fetcher.service';
import { NormalizedListing } from './normalized';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** Координаты Коста-Бланки, из которых собирается позиция пина на карте поиска. */
const BBOX = { minLat: 37.9, maxLat: 38.85, minLng: -0.95, maxLng: 0.25 };

const percent = (value: number) => `${Math.round(Math.min(96, Math.max(4, value)))}%`;

@Injectable()
export class FeedImportService {
  private readonly logger = new Logger(FeedImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fetcher: FeedFetcherService,
  ) {}

  /**
   * Одна синхронизация фида: скачать, разобрать, обновить объекты агентства
   * и снять с публикации всё, чего в выгрузке больше нет.
   */
  async sync(feedId: string) {
    const feed = await this.prisma.agencyFeed.findUnique({ where: { id: feedId } });
    if (!feed) throw new NotFoundException('Фид не найден');

    const run = await this.prisma.feedRun.create({
      data: { feedId: feed.id, status: FeedRunStatus.RUNNING },
    });

    try {
      const { items, skipped, format } = await this.fetcher.fetchAndParse(feed.url, feed.format);
      const stats = await this.upsertAll(feed, items);
      const archived = await this.archiveMissing(feed, items.map((i) => i.externalId));

      await this.prisma.$transaction([
        this.prisma.feedRun.update({
          where: { id: run.id },
          data: {
            status: FeedRunStatus.SUCCESS,
            parsed: items.length,
            created: stats.created,
            updated: stats.updated,
            skipped: skipped.length,
            archived,
            finishedAt: new Date(),
          },
        }),
        this.prisma.agencyFeed.update({
          where: { id: feed.id },
          data: {
            format,
            status: 'ACTIVE',
            lastRunAt: new Date(),
            lastOkAt: new Date(),
            lastError: null,
            listingCount: items.length,
          },
        }),
      ]);

      this.logger.log(
        `Фид ${feed.id}: +${stats.created} новых, ${stats.updated} обновлено, ${archived} снято`,
      );
      return { runId: run.id, parsed: items.length, ...stats, archived, skipped };
    } catch (err: any) {
      await this.prisma.$transaction([
        this.prisma.feedRun.update({
          where: { id: run.id },
          data: { status: FeedRunStatus.FAILED, error: err.message, finishedAt: new Date() },
        }),
        this.prisma.agencyFeed.update({
          where: { id: feed.id },
          data: { status: 'ERROR', lastRunAt: new Date(), lastError: err.message },
        }),
      ]);
      this.logger.error(`Фид ${feed.id} упал: ${err.message}`);
      throw err;
    }
  }

  private async upsertAll(feed: AgencyFeed, items: NormalizedListing[]) {
    let created = 0;
    let updated = 0;

    for (const item of items) {
      const hash = createHash('sha1').update(JSON.stringify(item.raw)).digest('hex');
      const existing = await this.prisma.listing.findUnique({
        where: { agencyId_externalId: { agencyId: feed.agencyId, externalId: item.externalId } },
        select: { id: true, externalHash: true },
      });

      // Ничего не изменилось — только отмечаем, что объект всё ещё в выгрузке.
      if (existing?.externalHash === hash) {
        await this.prisma.listing.update({
          where: { id: existing.id },
          data: { lastSeenAt: new Date(), status: 'PUBLISHED' },
        });
        updated += 1;
        continue;
      }

      const data = this.toListingData(feed, item, hash);

      if (existing) {
        await this.prisma.listing.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await this.prisma.listing.create({
          data: {
            ...data,
            id: `${feed.agencyId}-${item.externalId}`.slice(0, 60),
            slug: `${slugify(item.title)}-${slugify(item.externalId)}`,
          },
        });
        created += 1;
      }
    }

    return { created, updated };
  }

  private toListingData(feed: AgencyFeed, item: NormalizedListing, hash: string) {
    const [cover, ...gallery] = item.images;

    return {
      title: item.title,
      description: item.description || item.title,
      address: item.address,
      city: item.city || 'Аликанте',
      kind: item.kind,
      price: item.price,
      area: item.area,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      seaView: item.seaView,
      seaDistance: item.seaView ? '350 м' : null,
      yearBuilt: item.yearBuilt,
      features: item.features,
      coverImage: cover,
      gallery: gallery.slice(0, 12),
      mapX: this.mapX(item.lng),
      mapY: this.mapY(item.lat),
      agencyId: feed.agencyId,
      feedId: feed.id,
      source: 'FEED' as const,
      status: 'PUBLISHED' as const,
      // Бейдж Verificado выдаётся только после nota simple и видео-тура,
      // импорт из фида его не ставит.
      verified: false,
      externalId: item.externalId,
      externalHash: hash,
      lastSeenAt: new Date(),
    };
  }

  private mapX(lng: number | null) {
    if (lng == null) return '50%';
    return percent(((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100);
  }

  private mapY(lat: number | null) {
    if (lat == null) return '50%';
    return percent(((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * 100);
  }

  /** Объект пропал из выгрузки — уводим в архив, а не удаляем: на него могут быть лиды. */
  private async archiveMissing(feed: AgencyFeed, presentIds: string[]) {
    const { count } = await this.prisma.listing.updateMany({
      where: {
        feedId: feed.id,
        status: 'PUBLISHED',
        externalId: { notIn: presentIds.length ? presentIds : ['__none__'] },
      },
      data: { status: 'ARCHIVED' },
    });
    return count;
  }
}
