import { Injectable } from '@nestjs/common';
import { Placement, PromotionTier, type Listing, type Agency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  medianPricePerM2,
  scoreListing,
  similarityScore,
  type Rankable,
  type RankResult,
} from './ranking';

type WithAgency = Listing & { agency: Pick<Agency, 'replyTime'> };

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Действующие уровни продвижения — одним запросом на всю выдачу. */
  async activePromotions(listingIds: string[]): Promise<Map<string, PromotionTier>> {
    if (!listingIds.length) return new Map();

    const now = new Date();
    const rows = await this.prisma.promotion.findMany({
      where: {
        listingId: { in: listingIds },
        status: 'ACTIVE',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: { listingId: true, tier: true },
    });

    // У объявления может быть несколько покупок сразу — берём сильнейшую.
    const order: PromotionTier[] = ['NONE', 'BUMP', 'FEATURED', 'TOP_AREA'];
    const best = new Map<string, PromotionTier>();
    for (const r of rows) {
      const current = best.get(r.listingId) ?? 'NONE';
      if (order.indexOf(r.tier) > order.indexOf(current)) best.set(r.listingId, r.tier);
    }
    return best;
  }

  toRankable(l: WithAgency, tier: PromotionTier): Rankable {
    return {
      id: l.id,
      price: l.price,
      area: l.area,
      bedrooms: l.bedrooms,
      kind: l.kind,
      seaView: l.seaView,
      verified: l.verified,
      videoTour: l.videoTour,
      publishedAt: l.publishedAt,
      photos: 1 + l.gallery.length,
      descriptionLength: l.description.length,
      lat: l.lat,
      lng: l.lng,
      // Район — первая часть адреса: «Altea Hills, Альтея».
      area_name: l.address.split(',')[0]?.trim() ?? null,
      agencyReplyTime: l.agency.replyTime,
      promotionTier: tier,
    };
  }

  /**
   * Сортирует выдачу по итоговому весу.
   *
   * `overrideTiers` подставляет уровень продвижения, посчитанный по всем
   * предложениям объекта: при дублях платит одно агентство, а в выдаче
   * может стоять карточка другого.
   */
  async rank<T extends WithAgency>(
    listings: T[],
    area?: string | null,
    overrideTiers?: Map<string, PromotionTier>,
  ): Promise<{ sorted: T[]; scores: Map<string, RankResult> }> {
    const tiers = overrideTiers?.size
      ? overrideTiers
      : await this.activePromotions(listings.map((l) => l.id));
    const median = medianPricePerM2(listings);
    const now = new Date();

    const scores = new Map<string, RankResult>();
    for (const l of listings) {
      const rankable = this.toRankable(l, tiers.get(l.id) ?? 'NONE');
      scores.set(l.id, scoreListing(rankable, { medianPricePerM2: median, now, area }));
    }

    const sorted = [...listings].sort(
      (a, b) => (scores.get(b.id)?.score ?? 0) - (scores.get(a.id)?.score ?? 0),
    );

    return { sorted, scores };
  }

  /**
   * Похожие объекты рядом. Считаем по всей опубликованной базе того же города:
   * на нашем объёме это дешевле, чем поддерживать отдельный индекс.
   */
  async similar(listingId: string, take = 6) {
    const base = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { agency: { select: { replyTime: true } } },
    });
    if (!base) return [];

    const pool = await this.prisma.listing.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: base.id },
        city: base.city,
        // Один и тот же объект от другого агентства — не рекомендация.
        ...(base.propertyId ? { propertyId: { not: base.propertyId } } : {}),
      },
      include: {
        agency: { select: { id: true, name: true, initials: true, brandColor: true, logoUrl: true, verified: true, replyTime: true } },
      },
      take: 200,
    });

    const tiers = await this.activePromotions(pool.map((l) => l.id));
    const baseRankable = this.toRankable(base, 'NONE');

    const scored = pool
      .map((l) => {
        const { score, distance } = similarityScore(baseRankable, this.toRankable(l, 'NONE'));
        // Продвижение слегка поднимает и в рекомендациях, но решает похожесть.
        const tier = tiers.get(l.id) ?? 'NONE';
        const boost = tier === 'TOP_AREA' ? 0.08 : tier === 'FEATURED' ? 0.05 : 0;
        return { listing: l, score: score + (score > 0 ? boost : 0), distance, promotionTier: tier };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    // Одну квартиру от двух агентств рекомендовать дважды нельзя — в подборке
    // остаётся лучшее предложение по каждому объекту.
    const seen = new Set<string>();
    const unique: typeof scored = [];
    for (const item of scored) {
      const key = item.listing.propertyId ?? item.listing.id;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
      if (unique.length === take) break;
    }

    return unique;
  }

  /** Показы и клики — по ним считается CTR в кабинете. */
  async track(listingId: string, placement: Placement, field: 'impressions' | 'clicks' | 'leads', by = 1) {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);

    await this.prisma.listingStat.upsert({
      where: { listingId_day_placement: { listingId, day, placement } },
      create: { listingId, day, placement, [field]: by },
      update: { [field]: { increment: by } },
    });
  }
}
