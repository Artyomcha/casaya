import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Placement, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Порядок стадий воронки — он же порядок колонок в CRM. */
export const PIPELINE: LeadStatus[] = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'WON', 'LOST'];

const LEAD_INCLUDE = {
  listing: { select: { id: true, slug: true, title: true, address: true, price: true } },
  assignee: { select: { id: true, name: true, email: true } },
  notes: { orderBy: { createdAt: 'desc' }, take: 20, include: { author: { select: { id: true, name: true } } } },
} satisfies Prisma.LeadInclude;

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  /** Воронка агентства: отклики, разложенные по стадиям. */
  async pipeline(agencyId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { OR: [{ agencyId }, { listing: { agencyId } }] },
      include: LEAD_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const columns = PIPELINE.map((status) => ({
      status,
      leads: leads.filter((l) => l.status === status),
    }));

    const won = leads.filter((l) => l.status === 'WON').length;
    const closed = won + leads.filter((l) => l.status === 'LOST').length;

    return {
      columns,
      total: leads.length,
      /// Конверсия считается от закрытых, а не от всех: незакрытые ещё в работе.
      conversion: closed ? won / closed : 0,
      overdue: leads.filter(
        (l) => l.nextStepAt && l.nextStepAt < new Date() && !['WON', 'LOST'].includes(l.status),
      ).length,
    };
  }

  async move(leadId: string, status: LeadStatus) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Отклик не найден');

    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        // Момент первого контакта фиксируем один раз — по нему считается скорость ответа.
        contactedAt: status !== 'NEW' && !lead.contactedAt ? new Date() : lead.contactedAt,
      },
      include: LEAD_INCLUDE,
    });
  }

  assign(leadId: string, assigneeId: string | null) {
    return this.prisma.lead.update({
      where: { id: leadId },
      data: { assigneeId },
      include: LEAD_INCLUDE,
    });
  }

  schedule(leadId: string, nextStepAt: Date | null) {
    return this.prisma.lead.update({ where: { id: leadId }, data: { nextStepAt }, include: LEAD_INCLUDE });
  }

  addNote(leadId: string, text: string, authorId?: string) {
    return this.prisma.leadNote.create({ data: { leadId, text, authorId: authorId ?? null } });
  }

  /**
   * Аналитика агентства: показы, клики и отклики по объявлениям.
   * Именно эту таблицу агентство открывает, чтобы понять, что окупается.
   */
  async analytics(agencyId: string, days = 30) {
    const since = new Date(Date.now() - days * 86_400_000);
    since.setUTCHours(0, 0, 0, 0);

    const listings = await this.prisma.listing.findMany({
      where: { agencyId, status: 'PUBLISHED' },
      select: {
        id: true,
        slug: true,
        title: true,
        address: true,
        price: true,
        verified: true,
        coverImage: true,
        stats: { where: { day: { gte: since } } },
        promotions: {
          where: { status: 'ACTIVE', endsAt: { gte: new Date() } },
          select: { tier: true, endsAt: true, area: true },
        },
        _count: { select: { leads: true, favorites: true } },
      },
      take: 200,
    });

    const rows = listings.map((l) => {
      const impressions = l.stats.reduce((s, x) => s + x.impressions, 0);
      const clicks = l.stats.reduce((s, x) => s + x.clicks, 0);
      return {
        id: l.id,
        slug: l.slug,
        title: l.title,
        address: l.address,
        price: l.price,
        verified: l.verified,
        coverImage: l.coverImage,
        impressions,
        clicks,
        ctr: impressions ? clicks / impressions : 0,
        leads: l._count.leads,
        favorites: l._count.favorites,
        promotion: l.promotions[0] ?? null,
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        impressions: acc.impressions + r.impressions,
        clicks: acc.clicks + r.clicks,
        leads: acc.leads + r.leads,
      }),
      { impressions: 0, clicks: 0, leads: 0 },
    );

    return {
      days,
      totals: { ...totals, ctr: totals.impressions ? totals.clicks / totals.impressions : 0 },
      // Сначала то, что приносит отклики, потом то, что просто набирает показы.
      rows: rows.sort((a, b) => b.leads - a.leads || b.impressions - a.impressions),
    };
  }

  /** Кабинет частного собственника: его объявления и отклики по ним. */
  async ownerDashboard(userId: string) {
    const listings = await this.prisma.listing.findMany({
      where: { ownerId: userId },
      select: {
        id: true, slug: true, title: true, address: true, price: true,
        status: true, verified: true, coverImage: true,
        stats: true,
        promotions: { where: { status: 'ACTIVE' }, select: { tier: true, endsAt: true } },
        _count: { select: { leads: true, favorites: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });

    const leads = await this.prisma.lead.findMany({
      where: { listing: { ownerId: userId } },
      include: LEAD_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      listings: listings.map((l) => ({
        ...l,
        impressions: l.stats.reduce((s, x) => s + x.impressions, 0),
        clicks: l.stats.reduce((s, x) => s + x.clicks, 0),
        stats: undefined,
      })),
      leads,
      newLeads: leads.filter((l) => l.status === 'NEW').length,
    };
  }

  /** Фиксация показа или клика — вызывается витриной. */
  track(listingId: string, placement: Placement, field: 'impressions' | 'clicks') {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    return this.prisma.listingStat.upsert({
      where: { listingId_day_placement: { listingId, day, placement } },
      create: { listingId, day, placement, [field]: 1 },
      update: { [field]: { increment: 1 } },
    });
  }
}
