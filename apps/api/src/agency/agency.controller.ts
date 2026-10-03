import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AgencyGuard } from '../auth/agency.guard';
import { AgencyService } from './agency.service';
import { RegisterAgencyDto, UpdatePricingDto } from './dto';

@Controller('agencies')
export class AgencyController {
  constructor(private readonly agency: AgencyService) {}

  /**
   * Форма «Подключить агентство» открыта всем: это вход в воронку.
   * Но если регистрирующий вошёл в Casaya, он сразу становится владельцем —
   * иначе кабинетом потом некому управлять.
   */
  @Post('register')
  register(@Body() dto: RegisterAgencyDto, @Headers('authorization') header?: string) {
    return this.agency.register(dto, header);
  }

  @UseGuards(AgencyGuard)
  @Get(':id/dashboard')
  dashboard(@Param('id') id: string) {
    return this.agency.dashboard(id);
  }

  @UseGuards(AgencyGuard)
  @Get(':id/listings')
  listings(@Param('id') id: string) {
    return this.agency.listings(id);
  }

  /** Две цены объекта: рыночная и на Casaya. */
  @UseGuards(AgencyGuard)
  @Patch(':id/listings/:listingId/pricing')
  updatePricing(
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Body() dto: UpdatePricingDto,
  ) {
    return this.agency.updatePricing(id, listingId, dto);
  }

  /** Карточка агентства открыта: её видно в каждом объявлении выдачи. */
  @Get(':id')
  byId(@Param('id') id: string) {
    return this.agency.byId(id);
  }
}
