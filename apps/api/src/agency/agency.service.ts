import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAgencyDto } from './dto';

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Палитра аватаров агентств — та же, что в выдаче портала. */
const BRAND_COLORS = ['#6D3BF5', '#16A37A', '#FF5A3C', '#2F80ED', '#17112B'];

@Injectable()
export class AgencyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Регистрация агентства из формы «Подключить агентство».
   * Базовое размещение бесплатно 12 месяцев — срок пишем сразу.
   */
  async register(dto: RegisterAgencyDto) {
    const existing = await this.prisma.agency.findUnique({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('Агентство с таким названием уже зарегистрировано');

    const count = await this.prisma.agency.count();
    const freeUntil = new Date();
    freeUntil.setFullYear(freeUntil.getFullYear() + 1);

    const agency = await this.prisma.agency.create({
      data: {
        name: dto.name,
        initials: initialsOf(dto.name),
        brandColor: BRAND_COLORS[count % BRAND_COLORS.length],
        crm: dto.crm,
        contactEmail: dto.email,
        contactPhone: dto.phone,
        planKey: dto.planKey ?? 'start',
        verified: false,
        freeUntil,
      },
    });

    await this.prisma.lead.create({
      data: {
        kind: 'AGENCY',
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        payload: { agencyId: agency.id, crm: dto.crm, feedUrl: dto.feedUrl, planKey: dto.planKey },
      },
    });

    return agency;
  }

  async byId(id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        plan: true,
        feeds: { orderBy: { createdAt: 'desc' } },
        _count: { select: { listings: true } },
      },
    });
    if (!agency) throw new NotFoundException('Агентство не найдено');
    return agency;
  }

  /** Сводка кабинета Casaya Pro: инвентарь, состояние фидов, отклики. */
  async dashboard(id: string) {
    const agency = await this.byId(id);

    const [published, archived, verified, leads, lastRun] = await Promise.all([
      this.prisma.listing.count({ where: { agencyId: id, status: 'PUBLISHED' } }),
      this.prisma.listing.count({ where: { agencyId: id, status: 'ARCHIVED' } }),
      this.prisma.listing.count({ where: { agencyId: id, verified: true } }),
      this.prisma.lead.findMany({
        where: { listing: { agencyId: id } },
        include: { listing: { select: { id: true, slug: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.feedRun.findFirst({
        where: { feed: { agencyId: id } },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return {
      agency,
      inventory: { published, archived, verified, verifiedShare: published ? verified / published : 0 },
      feeds: agency.feeds,
      lastRun,
      leads,
      newLeads: leads.filter((l) => l.status === 'NEW').length,
    };
  }

  listings(id: string) {
    return this.prisma.listing.findMany({
      where: { agencyId: id },
      orderBy: [{ status: 'asc' }, { publishedAt: 'desc' }],
      take: 500,
    });
  }
}
