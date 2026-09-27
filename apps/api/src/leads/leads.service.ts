import { Injectable } from '@nestjs/common';
import { LeadKind, LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLeadDto) {
    const { payload, ...rest } = dto;
    return this.prisma.lead.create({
      data: { ...rest, payload: (payload ?? undefined) as Prisma.InputJsonValue | undefined },
      select: { id: true, kind: true, status: true, createdAt: true },
    });
  }

  list(kind?: LeadKind, status?: LeadStatus) {
    return this.prisma.lead.findMany({
      where: { ...(kind ? { kind } : {}), ...(status ? { status } : {}) },
      include: { listing: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
