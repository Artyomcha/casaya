import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ConnectFeedDto, PreviewFeedDto } from './dto';
import { FeedsService } from './feeds.service';

@Controller('feeds')
export class FeedsController {
  constructor(private readonly feeds: FeedsService) {}

  @Get('formats')
  formats() {
    return this.feeds.formats();
  }

  /** Предпросмотр до подключения — ничего не сохраняет. */
  @Post('preview')
  preview(@Body() dto: PreviewFeedDto) {
    return this.feeds.preview(dto);
  }

  @Post()
  connect(@Body() dto: ConnectFeedDto) {
    return this.feeds.connect(dto);
  }

  @Get()
  list(@Query('agencyId') agencyId: string) {
    return this.feeds.listByAgency(agencyId);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.feeds.byId(id);
  }

  @Post(':id/sync')
  sync(@Param('id') id: string) {
    return this.feeds.sync(id);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.feeds.setStatus(id, 'PAUSED');
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.feeds.setStatus(id, 'ACTIVE');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feeds.remove(id);
  }
}
