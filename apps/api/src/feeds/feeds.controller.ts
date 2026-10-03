import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AgencyGuard } from '../auth/agency.guard';
import { AuthGuard } from '../auth/auth.guard';
import { FeedGuard } from '../auth/feed.guard';
import { ConnectFeedDto, PreviewFeedDto } from './dto';
import { FeedsService } from './feeds.service';

@Controller('feeds')
export class FeedsController {
  constructor(private readonly feeds: FeedsService) {}

  @Get('formats')
  formats() {
    return this.feeds.formats();
  }

  /**
   * Предпросмотр до подключения — ничего не сохраняет, но ходит по ссылке
   * от нашего имени, поэтому открыт только вошедшим.
   */
  @UseGuards(AuthGuard)
  @Post('preview')
  preview(@Body() dto: PreviewFeedDto) {
    return this.feeds.preview(dto);
  }

  @UseGuards(AgencyGuard)
  @Post()
  connect(@Body() dto: ConnectFeedDto) {
    return this.feeds.connect(dto);
  }

  @UseGuards(AgencyGuard)
  @Get()
  list(@Query('agencyId') agencyId: string) {
    return this.feeds.listByAgency(agencyId);
  }

  @UseGuards(FeedGuard)
  @Get(':id')
  byId(@Param('id') id: string) {
    return this.feeds.byId(id);
  }

  @UseGuards(FeedGuard)
  @Post(':id/sync')
  sync(@Param('id') id: string) {
    return this.feeds.sync(id);
  }

  @UseGuards(FeedGuard)
  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.feeds.setStatus(id, 'PAUSED');
  }

  @UseGuards(FeedGuard)
  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.feeds.setStatus(id, 'ACTIVE');
  }

  @UseGuards(FeedGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feeds.remove(id);
  }
}
