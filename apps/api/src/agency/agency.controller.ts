import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { RegisterAgencyDto } from './dto';

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

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.agency.byId(id);
  }
}
