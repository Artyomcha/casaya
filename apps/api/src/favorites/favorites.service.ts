import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            agency: { select: { id: true, name: true, initials: true, brandColor: true, logoUrl: true, verified: true, replyTime: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.listing);
  }

  async toggle(userId: string, listingId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { listingId, favorite: false };
    }

    await this.prisma.favorite.create({ data: { userId, listingId } });
    return { listingId, favorite: true };
  }

  /** Перенос избранного, накопленного анонимно в localStorage, после входа. */
  async merge(userId: string, listingIds: string[]) {
    if (!listingIds.length) return this.list(userId);
    await this.prisma.favorite.createMany({
      data: listingIds.map((listingId) => ({ userId, listingId })),
      skipDuplicates: true,
    });
    return this.list(userId);
  }
}
