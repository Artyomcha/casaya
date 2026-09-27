import { Transform, Type } from 'class-transformer';
import { IsBooleanString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DealType, PropertyKind } from '@prisma/client';

/** Пресеты фильтра из дизайна: Все / Квартиры / Дома / У моря. */
export type ListingFilter = 'all' | 'flat' | 'house' | 'sea';

export class ListingQueryDto {
  @IsOptional()
  @IsEnum(['all', 'flat', 'house', 'sea'] as const, {
    message: 'filter must be one of: all, flat, house, sea',
  })
  filter?: ListingFilter = 'all';

  @IsOptional()
  @IsEnum(DealType)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  deal?: DealType = DealType.SALE;

  @IsOptional()
  @IsEnum(PropertyKind)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  kind?: PropertyKind;

  /** Несколько типов через запятую — чипсы фильтра в приложении. */
  @IsOptional()
  @IsEnum(PropertyKind, { each: true })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean)
      : value,
  )
  kinds?: PropertyKind[];

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  bedrooms?: number;

  @IsOptional()
  @IsBooleanString()
  verifiedOnly?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 48;
}
