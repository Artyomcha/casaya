import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PromotionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Прайс продвижения из бизнес-плана, в центах за неделю. */
export const TARIFFS: Record<Exclude<PromotionTier, 'NONE'>, { cents: number; days: number; label: string }> = {
  BUMP: { cents: 990, days: 1, label: 'Subida' },
  FEATURED: { cents: 1990, days: 7, label: 'Destacado' },
  TOP_AREA: { cents: 3990, days: 7, label: 'Top района' },
};

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  tariffs() {
    return Object.entries(TARIFFS).map(([tier, t]) => ({ tier, ...t }));
  }

  /**
   * Покупка продвижения. Оплата здесь заглушена: на проде между заявкой
   * и ACTIVE встаёт платёжный провайдер и вебхук об успешной оплате.
   */
  async purchase(listingId: string, tier: Exclude<PromotionTier, 'NONE'>, area?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, address: true, status: true },
    });
    if (!listing) throw new NotFoundException('Объявление не найдено');
    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException('Продвигать можно только опубликованное объявление');
    }

    const tariff = TARIFFS[tier];
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + tariff.days * 86_400_000);

    // Top района без района бессмыслен — подставляем район объявления.
    const resolvedArea = tier === 'TOP_AREA' ? (area ?? listing.address.split(',')[0]?.trim()) : null;

    return this.prisma.promotion.create({
      data: {
        listingId,
        tier,
        area: resolvedArea,
        startsAt,
        endsAt,
        priceCents: tariff.cents,
        status: 'ACTIVE',
      },
    });
  }

  async cancel(id: string) {
    return this.prisma.promotion.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  listByAgency(agencyId: string) {
    return this.prisma.promotion.findMany({
      where: { listing: { agencyId } },
      include: { listing: { select: { id: true, slug: true, title: true, address: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /** Раз в час гасим истёкшие покупки, чтобы они не влияли на выдачу. */
  @Cron(CronExpression.EVERY_HOUR)
  async expire() {
    const { count } = await this.prisma.promotion.updateMany({
      where: { status: 'ACTIVE', endsAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    if (count) this.logger.log(`Истекло продвижений: ${count}`);
  }
}
