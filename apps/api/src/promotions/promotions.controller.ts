import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PromotionTier } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PromotionsService } from './promotions.service';

class PurchaseDto {
  @IsString()
  listingId: string;

  @IsEnum(['BUMP', 'FEATURED', 'TOP_AREA'] as const)
  tier: Exclude<PromotionTier, 'NONE'>;

  @IsOptional() @IsString()
  area?: string;
}

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get('tariffs')
  tariffs() {
    return this.promotions.tariffs();
  }

  @Get()
  list(@Query('agencyId') agencyId: string) {
    return this.promotions.listByAgency(agencyId);
  }

  @Post()
  purchase(@Body() dto: PurchaseDto) {
    return this.promotions.purchase(dto.listingId, dto.tier, dto.area);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.promotions.cancel(id);
  }
}
