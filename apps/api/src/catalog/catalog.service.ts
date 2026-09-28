import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PropertiesService } from '../properties/properties.service';
import { RankingService } from '../ranking/ranking.service';
import { ListingQueryDto } from './dto';

/** Множитель месячной аренды от цены продажи — как в витрине портала. */
export const RENT_RATIO = 0.0045;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ranking: RankingService,
    private readonly properties: PropertiesService,
  ) {}

  private readonly listingInclude = {
    agency: { select: { id: true, name: true, initials: true, brandColor: true, verified: true, replyTime: true } },
  } satisfies Prisma.ListingInclude;

  async listings(query: ListingQueryDto) {
    // Витрина показывает только опубликованное: архив из фидов и черновики скрыты.
    const where: Prisma.ListingWhereInput = { status: 'PUBLISHED' };

    // Пресет «Квартиры» покрывает и студии с пентхаусами, «Дома» — виллы и таунхаусы:
    // на витрине это одна привычная категория, в базе — разные типы.
    if (query.filter === 'flat') where.kind = { in: ['FLAT', 'STUDIO', 'PENTHOUSE'] };
    if (query.filter === 'house') where.kind = { in: ['HOUSE', 'VILLA', 'TOWNHOUSE'] };
    if (query.filter === 'sea') where.seaView = true;
    if (query.kind) where.kind = query.kind;
    if (query.kinds?.length) where.kind = { in: query.kinds };
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

    const found = await this.prisma.listing.findMany({
      where,
      include: { ...this.listingInclude, property: { select: { id: true, slug: true } } },
      orderBy: { publishedAt: 'desc' },
      take: 300,
    });

    // Одну квартиру продают несколько агентств — в выдаче это одна карточка.
    const deduped = query.showDuplicates === 'true' ? found : this.collapseDuplicates(found);

    const { sorted, scores } = await this.ranking.rank(deduped, query.area);
    const take = query.take ?? 48;
    const page = sorted.slice(0, take);

    const offerCounts = await this.offerCounts(page.map((l) => l.propertyId));

    return {
      items: page.map((l) => ({
        ...l,
        /// Сколько агентств продают этот же объект, включая текущее.
        offersCount: l.propertyId ? (offerCounts.get(l.propertyId) ?? 1) : 1,
        rank: query.debug === 'true' ? scores.get(l.id) : undefined,
      })),
      total: deduped.length,
      /// Сколько карточек-дублей посетитель не увидел.
      collapsed: found.length - deduped.length,
    };
  }

  /**
   * Из нескольких предложений по одному объекту оставляем одно.
   * Побеждает проверенное, при равенстве — самое дешёвое: покупателю
   * важнее цена, а агентству — что его объект вообще виден.
   */
  private collapseDuplicates<T extends { id: string; propertyId: string | null; price: number; verified: boolean }>(
    listings: T[],
  ): T[] {
    const best = new Map<string, T>();
    const singles: T[] = [];

    for (const l of listings) {
      if (!l.propertyId) {
        singles.push(l);
        continue;
      }
      const current = best.get(l.propertyId);
      if (
        !current ||
        (l.verified && !current.verified) ||
        (l.verified === current.verified && l.price < current.price)
      ) {
        best.set(l.propertyId, l);
      }
    }

    return [...best.values(), ...singles];
  }

  private async offerCounts(propertyIds: (string | null)[]): Promise<Map<string, number>> {
    const ids = propertyIds.filter((id): id is string => !!id);
    if (!ids.length) return new Map();

    const grouped = await this.prisma.listing.groupBy({
      by: ['propertyId'],
      where: { propertyId: { in: ids }, status: 'PUBLISHED' },
      _count: { _all: true },
    });

    return new Map(grouped.map((g) => [g.propertyId!, g._count._all]));
  }

  async listing(idOrSlug: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { ...this.listingInclude, project: true },
    });
    if (!listing) throw new NotFoundException(`Объект ${idOrSlug} не найден`);
    return listing;
  }

  /**
   * Похожие объекты рядом. Считает алгоритм похожести: расстояние, цена,
   * площадь, комнаты. Другое предложение по тому же объекту сюда не попадёт.
   */
  async similar(idOrSlug: string, take = 6) {
    const base = await this.listing(idOrSlug);
    const scored = await this.ranking.similar(base.id, take);

    return scored.map((s) => ({
      ...s.listing,
      similarity: Number(s.score.toFixed(3)),
      distanceMeters: s.distance == null ? null : Math.round(s.distance),
      promotionTier: s.promotionTier,
    }));
  }

  /** Все предложения агентств по объекту — сравнение цен на карточке. */
  offers(propertyId: string) {
    return this.properties.offers(propertyId);
  }

  /** Сводка по схлопнутым дублям — витрина честности «solo pisos reales». */
  duplicateStats() {
    return this.properties.duplicateStats();
  }

  /** Пины на карте поиска — по всем объектам, без учёта фильтра, как в дизайне. */
  mapPins() {
    return this.prisma.listing.findMany({
      where: { status: 'PUBLISHED', lat: { not: null }, lng: { not: null } },
      select: {
        id: true, slug: true, title: true, address: true, price: true,
        lat: true, lng: true, kind: true, bedrooms: true, area: true,
        coverImage: true, verified: true,
      },
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
