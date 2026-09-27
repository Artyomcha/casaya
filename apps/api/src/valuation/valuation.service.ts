import { Injectable } from '@nestjs/common';
import { PropertyKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Базовая цена м² по типу объекта, Коста-Бланка. */
export const BASE_PRICE_PER_M2: Partial<Record<PropertyKind, number>> = {
  FLAT: 2650,
  HOUSE: 2400,
  PENTHOUSE: 3300,
  TOWNHOUSE: 2500,
  COMMERCIAL: 1900,
};

/** Каждая спальня сверх двух добавляет 3% к оценке. */
const BEDROOM_STEP = 0.03;
const SPREAD = 0.06;
const RENT_YIELD = 0.0045;

export interface ValuationInput {
  address: string;
  kind: PropertyKind;
  area: number;
  bedrooms: number;
}

@Injectable()
export class ValuationService {
  constructor(private readonly prisma: PrismaService) {}

  estimate({ kind, area, bedrooms }: ValuationInput) {
    const base = BASE_PRICE_PER_M2[kind] ?? BASE_PRICE_PER_M2.FLAT!;
    const raw = base * area * (1 + (bedrooms - 2) * BEDROOM_STEP);
    const round = (n: number) => Math.round(n / 1000) * 1000;

    return {
      estimate: round(raw),
      low: round(raw * (1 - SPREAD)),
      high: round(raw * (1 + SPREAD)),
      pricePerM2: Math.round(raw / area),
      rent: Math.round((raw * RENT_YIELD) / 10) * 10,
      dealsNearby: 38,
    };
  }

  async create(input: ValuationInput) {
    const result = this.estimate(input);
    const saved = await this.prisma.valuation.create({
      data: {
        address: input.address,
        kind: input.kind,
        area: input.area,
        bedrooms: input.bedrooms,
        estimate: result.estimate,
        low: result.low,
        high: result.high,
        pricePerM2: result.pricePerM2,
        rent: result.rent,
      },
    });
    return { id: saved.id, ...result };
  }
}
