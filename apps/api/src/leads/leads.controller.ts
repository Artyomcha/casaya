import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LeadKind, LeadStatus } from '@prisma/client';
import { CreateLeadDto } from './dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.leads.create(dto);
  }

  @Get()
  list(@Query('kind') kind?: LeadKind, @Query('status') status?: LeadStatus) {
    return this.leads.list(kind, status);
  }
}
