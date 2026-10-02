import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FeedFormat } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeedFetcherService } from './feed-fetcher.service';
import { FeedImportService } from './feed-import.service';
import { ConnectFeedDto, PreviewFeedDto } from './dto';

@Injectable()
export class FeedsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fetcher: FeedFetcherService,
    private readonly importer: FeedImportService,
  ) {}

  /**
   * Сухой прогон до подключения: агентство видит, сколько объектов подхватится
   * и что именно мы не смогли разобрать. Ничего не пишет в базу.
   */
  async preview(dto: PreviewFeedDto) {
    const { items, skipped, format } = await this.fetcher.fetchAndParse(dto.url, dto.format);

    return {
      format,
      total: items.length + skipped.length,
      importable: items.length,
      /// Объекты без рыночной цены импортируются, но в выдачу не попадут:
      /// подтвердить «дешевле рынка» нечем. Агентство дозаполнит их в кабинете.
      withoutMarketPrice: items.filter((i) => i.marketPrice == null).length,
      skipped: skipped.slice(0, 20),
      sample: items.slice(0, 5).map((i) => ({
        externalId: i.externalId,
        title: i.title,
        address: i.address,
        price: i.price,
        marketPrice: i.marketPrice,
        area: i.area,
        bedrooms: i.bedrooms,
        bathrooms: i.bathrooms,
        images: i.images.length,
        cover: i.images[0] ?? null,
      })),
    };
  }

  async connect(dto: ConnectFeedDto) {
    const agency = await this.prisma.agency.findUnique({ where: { id: dto.agencyId } });
    if (!agency) throw new NotFoundException('Агентство не найдено');

    const duplicate = await this.prisma.agencyFeed.findUnique({
      where: { agencyId_url: { agencyId: dto.agencyId, url: dto.url } },
    });
    if (duplicate) throw new BadRequestException('Этот фид уже подключён');

    // Проверяем доступность до сохранения, чтобы не заводить заведомо мёртвый источник.
    const { format } = await this.fetcher.fetchAndParse(dto.url, dto.format);

    const feed = await this.prisma.agencyFeed.create({
      data: {
        agencyId: dto.agencyId,
        url: dto.url,
        format: dto.format ?? format,
        intervalMin: dto.intervalMin ?? 60,
        status: 'PENDING',
      },
    });

    if (dto.syncNow !== false) await this.importer.sync(feed.id);
    return this.byId(feed.id);
  }

  async byId(id: string) {
    const feed = await this.prisma.agencyFeed.findUnique({
      where: { id },
      include: {
        agency: { select: { id: true, name: true, initials: true, brandColor: true } },
        runs: { orderBy: { startedAt: 'desc' }, take: 10 },
        _count: { select: { listings: true } },
      },
    });
    if (!feed) throw new NotFoundException('Фид не найден');
    return feed;
  }

  listByAgency(agencyId: string) {
    return this.prisma.agencyFeed.findMany({
      where: { agencyId },
      include: {
        runs: { orderBy: { startedAt: 'desc' }, take: 1 },
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setStatus(id: string, status: 'ACTIVE' | 'PAUSED') {
    await this.byId(id);
    return this.prisma.agencyFeed.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    await this.byId(id);
    // Объекты остаются в архиве вместе с историей лидов.
    await this.prisma.listing.updateMany({ where: { feedId: id }, data: { status: 'ARCHIVED' } });
    await this.prisma.agencyFeed.delete({ where: { id } });
    return { deleted: true };
  }

  sync(id: string) {
    return this.importer.sync(id);
  }

  /** Фиды, у которых истёк интервал опроса. */
  due(now = new Date()) {
    return this.prisma.agencyFeed.findMany({
      where: { status: { in: ['ACTIVE', 'PENDING'] } },
      select: { id: true, intervalMin: true, lastRunAt: true },
    }).then((feeds) =>
      feeds.filter(
        (f) => !f.lastRunAt || now.getTime() - f.lastRunAt.getTime() >= f.intervalMin * 60_000,
      ),
    );
  }

  formats(): FeedFormat[] {
    return ['INMOVILLA', 'WITEI', 'MOBILIA', 'KYERO', 'RESALES', 'CASAYA'];
  }
}
