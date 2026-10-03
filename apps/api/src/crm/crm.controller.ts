import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AgencyGuard } from '../auth/agency.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { LeadGuard } from '../auth/lead.guard';
import { LeadStatus, Placement } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CrmService } from './crm.service';

class MoveDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}

class AssignDto {
  @IsOptional() @IsString()
  assigneeId?: string | null;
}

class NoteDto {
  @IsString() @MaxLength(4000)
  text: string;

  @IsOptional() @IsString()
  authorId?: string;
}

class ScheduleDto {
  @IsOptional() @Type(() => Date) @IsDate()
  nextStepAt?: Date | null;
}

class TrackDto {
  @IsString()
  listingId: string;

  @IsEnum(Placement)
  placement: Placement;

  @IsEnum(['impressions', 'clicks'] as const)
  field: 'impressions' | 'clicks';
}

@Controller('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @UseGuards(AgencyGuard)
  @Get('pipeline')
  pipeline(@Query('agencyId') agencyId: string) {
    return this.crm.pipeline(agencyId);
  }

  @UseGuards(AgencyGuard)
  @Get('analytics')
  analytics(@Query('agencyId') agencyId: string, @Query('days') days?: string) {
    // Окно ограничиваем здесь: параметр приходит строкой из адреса.
    const window = Math.min(365, Math.max(1, Number(days) || 30));
    return this.crm.analytics(agencyId, window);
  }

  /** Кабинет частного продавца — свой и только свой. */
  @UseGuards(AuthGuard)
  @Get('owner/:userId')
  owner(@Param('userId') userId: string, @CurrentUser() current: string) {
    if (userId !== current) throw new ForbiddenException('Чужой кабинет недоступен');
    return this.crm.ownerDashboard(userId);
  }

  @UseGuards(LeadGuard)
  @Patch('leads/:id/status')
  move(@Param('id') id: string, @Body() dto: MoveDto) {
    return this.crm.move(id, dto.status);
  }

  @UseGuards(LeadGuard)
  @Patch('leads/:id/assignee')
  assign(@Param('id') id: string, @Body() dto: AssignDto) {
    return this.crm.assign(id, dto.assigneeId ?? null);
  }

  @UseGuards(LeadGuard)
  @Patch('leads/:id/schedule')
  schedule(@Param('id') id: string, @Body() dto: ScheduleDto) {
    return this.crm.schedule(id, dto.nextStepAt ?? null);
  }

  @UseGuards(LeadGuard)
  @Post('leads/:id/notes')
  addNote(@Param('id') id: string, @Body() dto: NoteDto) {
    return this.crm.addNote(id, dto.text, dto.authorId);
  }

  /** Показы и клики шлёт витрина за неизвестного посетителя — вход не нужен. */
  @Post('track')
  track(@Body() dto: TrackDto) {
    return this.crm.track(dto.listingId, dto.placement, dto.field);
  }
}
