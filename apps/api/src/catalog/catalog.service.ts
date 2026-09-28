import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PromotionTier, ServiceScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PropertiesService } from '../properties/properties.service';
import { promotedSlots, representativeOffer, type OfferLike } from '../properties/visibility';
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

    const tiers = await this.ranking.activePromotions(found.map((l) => l.id));
    const withTier = found.map((l) => ({ ...l, promotionTier: tiers.get(l.id) ?? ('NONE' as const) }));

    if (query.showDuplicates === 'true') {
      const { sorted, scores } = await this.ranking.rank(withTier, query.area);
      return {
        items: sorted.slice(0, query.take ?? 48).map((l) => ({
          ...l,
          promoted: l.promotionTier !== 'NONE',
          offersCount: 1,
          rank: query.debug === 'true' ? scores.get(l.id) : undefined,
        })),
        total: withTier.length,
        promotedCount: withTier.filter((l) => l.promotionTier !== 'NONE').length,
        collapsed: 0,
      };
    }

    // Оплаченные показы — отдельные слоты наверху выдачи. Купили два
    // агентства по одному объекту — наверху две карточки с разными ценами.
    const promoted = promotedSlots(withTier);
    const promotedIds = new Set(promoted.map((l) => l.id));

    // Ниже — обычная выдача: одна карточка на объект, лучшая для покупателя.
    // Если она же и оплачена, второй раз её не показываем.
    const organic = this.collapseDuplicates(withTier).filter((l) => !promotedIds.has(l.id));

    const counts = this.offerCounts(withTier);
    const { sorted, scores } = await this.ranking.rank(organic, query.area);

    // Оплаченные слоты не сортируются по весу — их порядок задаёт уровень
    // покупки. Но разбор им тоже считаем: агентство вправе знать, как
    // выглядит его объявление по качеству.
    if (query.debug === 'true' && promoted.length) {
      const { scores: promotedScores } = await this.ranking.rank(promoted, query.area);
      for (const [id, score] of promotedScores) scores.set(id, score);
    }

    const take = query.take ?? 48;
    const page = [...promoted, ...sorted].slice(0, take);

    return {
      items: page.map((l) => {
        const promoted = promotedIds.has(l.id);
        return {
          ...l,
          /// Оплаченный показ — витрина обязана пометить его как рекламу.
          promoted,
          /// Сколько агентств продают этот же объект.
          ///
          /// В оплаченной карточке всегда единица: агентство купило рекламу
          /// своего предложения и не обязано зазывать к конкурентам.
          offersCount: promoted || !l.propertyId ? 1 : (counts.get(l.propertyId) ?? 1),
          rank: query.debug === 'true' ? scores.get(l.id) : undefined,
        };
      }),
      total: promoted.length + organic.length,
      promotedCount: promoted.length,
      /// Сколько карточек-дублей схлопнуто в органической выдаче.
      collapsed: withTier.length - promoted.length - organic.length,
    };
  }

  /**
   * Из нескольких предложений по одному объекту оставляем одно —
   * лучшее для покупателя. Оплаченные показы к этому отношения не имеют,
   * они живут отдельными слотами наверху.
   */
  private collapseDuplicates<T extends OfferLike & { propertyId: string | null }>(listings: T[]): T[] {
    const byProperty = new Map<string, T[]>();
    const singles: T[] = [];

    for (const l of listings) {
      if (!l.propertyId) {
        singles.push(l);
        continue;
      }
      const group = byProperty.get(l.propertyId) ?? [];
      group.push(l);
      byProperty.set(l.propertyId, group);
    }

    const chosen = [...byProperty.values()]
      .map((group) => representativeOffer(group))
      .filter((l): l is T => !!l);

    return [...chosen, ...singles];
  }

  /** Сколько агентств продают каждый объект. */
  private offerCounts<T extends { propertyId: string | null }>(listings: T[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const l of listings) {
      if (!l.propertyId) continue;
      counts.set(l.propertyId, (counts.get(l.propertyId) ?? 0) + 1);
    }
    return counts;
  }

  async listing(idOrSlug: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        ...this.listingInclude,
        project: true,
        promotions: {
          where: { status: 'ACTIVE', startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
          select: { tier: true, endsAt: true },
          take: 1,
        },
      },
    });
    if (!listing) throw new NotFoundException(`Объект ${idOrSlug} не найден`);

    const { promotions, ...rest } = listing;
    return {
      ...rest,
      /// Страница оплаченного объявления — это реклама конкретного агентства.
      /// Сравнение с другими предложениями на ней не показывается.
      promoted: promotions.length > 0,
      promotionTier: promotions[0]?.tier ?? 'NONE',
    };
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
