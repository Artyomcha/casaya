import { Body, Controller, Post } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { PropertyKind } from '@prisma/client';
import { ValuationService } from './valuation.service';

class ValuationDto {
  @IsString() @MaxLength(200)
  address: string;

  @IsEnum(PropertyKind)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  kind: PropertyKind;

  @Type(() => Number) @IsInt() @Min(10) @Max(2000)
  area: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(20)
  bedrooms: number;
}

@Controller('valuation')
export class ValuationController {
  constructor(private readonly valuation: ValuationService) {}

  @Post()
  create(@Body() dto: ValuationDto) {
    return this.valuation.create(dto);
  }
}
