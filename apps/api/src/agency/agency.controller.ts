import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { RegisterAgencyDto, UpdatePricingDto } from './dto';

@Controller('agencies')
export class AgencyController {
  constructor(private readonly agency: AgencyService) {}

  @Post('register')
  register(@Body() dto: RegisterAgencyDto) {
    return this.agency.register(dto);
  }

  @Get(':id/dashboard')
  dashboard(@Param('id') id: string) {
    return this.agency.dashboard(id);
  }

  @Get(':id/listings')
  listings(@Param('id') id: string) {
    return this.agency.listings(id);
  }

  /** Две цены объекта: рыночная и на Casaya. */
  @Patch(':id/listings/:listingId/pricing')
  updatePricing(
    @Param('id') id: string,
    @Param('listingId') listingId: string,
    @Body() dto: UpdatePricingDto,
  ) {
    return this.agency.updatePricing(id, listingId, dto);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.agency.byId(id);
  }
}
