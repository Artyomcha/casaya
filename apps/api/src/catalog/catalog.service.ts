import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListingQueryDto } from './dto';

/** Множитель месячной аренды от цены продажи — как в витрине портала. */
export const RENT_RATIO = 0.0045;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listingInclude = {
    agency: { select: { id: true, name: true, initials: true, brandColor: true, verified: true, replyTime: true } },
  } satisfies Prisma.ListingInclude;

  async listings(query: ListingQueryDto) {
    // Витрина показывает только опубликованное: архив из фидов и черновики скрыты.
    const where: Prisma.ListingWhereInput = { status: 'PUBLISHED' };

    if (query.filter === 'flat') where.kind = 'FLAT';
    if (query.filter === 'house') where.kind = 'HOUSE';
    if (query.filter === 'sea') where.seaView = true;
    if (query.kind) where.kind = query.kind;
    if (query.verifiedOnly === 'true') where.verified = true;
    if (query.bedrooms) where.bedrooms = { gte: query.bedrooms };

    if (query.minPrice != null || query.maxPrice != null) {
      where.price = {
        ...(query.minPrice != null ? { gte: query.minPrice } : {}),
        ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
      };
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.listing.findMany({
      where,
      include: this.listingInclude,
      orderBy: { publishedAt: 'desc' },
      take: query.take ?? 48,
    });

    return { items, total: items.length };
  }

  async listing(idOrSlug: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { ...this.listingInclude, project: true },
    });
    if (!listing) throw new NotFoundException(`Объект ${idOrSlug} не найден`);
    return listing;
  }

  /** Похожие объекты рядом — блок на странице оценки и под объявлением. */
  async similar(idOrSlug: string, take = 3) {
    const base = await this.listing(idOrSlug);
    return this.prisma.listing.findMany({
      where: { id: { not: base.id }, status: 'PUBLISHED' },
      include: this.listingInclude,
      orderBy: { publishedAt: 'desc' },
      take,
    });
  }

  /** Пины на карте поиска — по всем объектам, без учёта фильтра, как в дизайне. */
  mapPins() {
    return this.prisma.listing.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, slug: true, price: true, mapX: true, mapY: true, title: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  projects(year?: string) {
    return this.prisma.project.findMany({
      where: year && year !== 'all' ? { deliveryYear: year } : {},
      include: { listings: { select: { id: true, slug: true }, take: 1 } },
      orderBy: { priceFrom: 'asc' },
    });
  }

  project(slug: string) {
    return this.prisma.project.findUnique({
      where: { slug },
      include: { listings: { include: this.listingInclude } },
    });
  }

  cities() {
    return this.prisma.city.findMany({ orderBy: { sort: 'asc' } });
  }

  banks() {
    return this.prisma.bank.findMany({ orderBy: { sort: 'asc' } });
  }

  plans() {
    return this.prisma.plan.findMany({ orderBy: { sort: 'asc' } });
  }

  services(scope?: ServiceScope) {
    return this.prisma.serviceOffer.findMany({
      where: scope ? { scope } : {},
      orderBy: { sort: 'asc' },
    });
  }

  agencies() {
    return this.prisma.agency.findMany({
      include: { _count: { select: { listings: true } } },
      orderBy: { name: 'asc' },
    });
  }
}
