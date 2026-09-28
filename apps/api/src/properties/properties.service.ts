import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, Property } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { canonicalMedia, type PhotoSet } from './media';
import {
  geoCell,
  matchKey,
  MATCH_THRESHOLD,
  scoreMatch,
  type MatchCandidate,
} from './match';


const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** Радиус поиска кандидатов по координатам, градусы (~400 м). */
const GEO_RADIUS = 0.004;

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Находит объект, к которому относится объявление, или заводит новый.
   *
   * Кандидаты отбираются грубо — по кадастровому номеру, координатной
   * окрестности или ключу «город + тип + площадь + спальни». Решение
   * принимает scoreMatch: лучший кандидат выше порога становится объектом.
   */
  async findOrCreate(candidate: MatchCandidate): Promise<{ property: Property; matched: boolean; score: number }> {
    if (candidate.cadastralRef) {
      const exact = await this.prisma.property.findUnique({
        where: { cadastralRef: candidate.cadastralRef },
      });
      if (exact) return { property: exact, matched: true, score: 1 };
    }

    const candidates = await this.candidates(candidate);

    let best: { property: Property; score: number } | null = null;
    for (const p of candidates) {
      const { score } = scoreMatch(candidate, p as MatchCandidate);
      if (score >= MATCH_THRESHOLD && (!best || score > best.score)) {
        best = { property: p, score };
      }
    }

    if (best) {
      this.logger.log(
        `Дубль: «${candidate.address}» → объект ${best.property.id} (совпадение ${best.score.toFixed(2)})`,
      );
      return { property: best.property, matched: true, score: best.score };
    }

    const property = await this.prisma.property.create({
      data: {
        slug: `${slugify(candidate.address)}-${Date.now().toString(36)}`,
        cadastralRef: candidate.cadastralRef ?? null,
        address: candidate.address,
        city: candidate.city,
        lat: candidate.lat ?? null,
        lng: candidate.lng ?? null,
        kind: candidate.kind,
        area: candidate.area,
        bedrooms: candidate.bedrooms,
        bathrooms: candidate.bathrooms,
        floor: candidate.floor ?? null,
        matchKey: matchKey(candidate),
      },
    });

    return { property, matched: false, score: 0 };
  }

  /** Грубый отбор: всё, что теоретически может оказаться тем же объектом. */
  private candidates(candidate: MatchCandidate) {
    const where: Prisma.PropertyWhereInput[] = [{ matchKey: matchKey(candidate) }];

    if (candidate.lat != null && candidate.lng != null) {
      where.push({
        lat: { gte: candidate.lat - GEO_RADIUS, lte: candidate.lat + GEO_RADIUS },
        lng: { gte: candidate.lng - GEO_RADIUS, lte: candidate.lng + GEO_RADIUS },
        kind: candidate.kind,
      });
    }

    return this.prisma.property.findMany({ where: { OR: where }, take: 50 });
  }

  /**
   * Пересобирает фотографии объекта после изменения набора предложений.
   * Вызывается импортом фида: новое агентство могло снять лучше прежнего.
   */
  async refreshMedia(propertyId: string) {
    const listings = await this.prisma.listing.findMany({
      where: { propertyId, status: 'PUBLISHED' },
      select: {
        id: true,
        coverImage: true,
        gallery: true,
        verified: true,
        videoTour: true,
        agency: { select: { name: true } },
      },
    });

    const sets: PhotoSet[] = listings.map((l) => ({
      listingId: l.id,
      agencyName: l.agency.name,
      coverImage: l.coverImage,
      gallery: l.gallery,
      verified: l.verified,
      videoTour: l.videoTour,
    }));

    const media = canonicalMedia(sets);
    await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        coverImage: media.coverImage,
        gallery: media.gallery,
        photoSource: media.source,
      },
    });

    return media;
  }

  /** Все предложения агентств по объекту — от самого дешёвого. */
  async offers(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        listings: {
          where: { status: 'PUBLISHED' },
          include: {
            agency: { select: { id: true, name: true, initials: true, brandColor: true, logoUrl: true, verified: true, replyTime: true } },
            promotions: {
              where: { status: 'ACTIVE', endsAt: { gte: new Date() } },
              select: { tier: true },
              take: 1,
            },
          },
          orderBy: { price: 'asc' },
        },
      },
    });
    if (!property) throw new NotFoundException('Объект не найден');

    const all = property.listings.map((l) => ({
      ...l,
      promotionTier: l.promotions[0]?.tier ?? ('NONE' as const),
      promoted: l.promotions.length > 0,
      promotions: undefined,
    }));

    // Здесь видны все предложения: покупатель, дошедший до объекта, должен
    // видеть полную картину цен. Оплаченные показы помечены.
    const prices = all.map((l) => l.price);

    // Кто какой кадр снял — подпись авторства в галерее.
    const media = canonicalMedia(
      all.map((l) => ({
        listingId: l.id,
        agencyName: l.agency.name,
        coverImage: l.coverImage,
        gallery: l.gallery,
        verified: l.verified,
        videoTour: l.videoTour,
      })),
    );

    return {
      property,
      media,
      offers: all,
      count: all.length,
      promotedCount: all.filter((l) => l.promoted).length,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      /// Разброс цен между видимыми агентствами.
      spread: prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0,
    };
  }

  /** Сводка по дублям — показывается в кабинете агентства и в админке. */
  async duplicateStats() {
    const grouped = await this.prisma.listing.groupBy({
      by: ['propertyId'],
      where: { status: 'PUBLISHED', propertyId: { not: null } },
      _count: { _all: true },
      having: { propertyId: { _count: { gt: 1 } } },
    });

    const duplicated = grouped.length;
    const extraListings = grouped.reduce((sum, g) => sum + g._count._all - 1, 0);
    const total = await this.prisma.listing.count({ where: { status: 'PUBLISHED' } });

    return {
      properties: await this.prisma.property.count(),
      listings: total,
      duplicatedProperties: duplicated,
      /// Сколько карточек посетитель не увидит, потому что мы их схлопнули.
      hiddenDuplicates: extraListings,
      share: total ? extraListings / total : 0,
    };
  }
}
