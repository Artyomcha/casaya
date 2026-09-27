import { Module } from '@nestjs/common';
import { FeedFetcherService } from './feed-fetcher.service';
import { FeedImportService } from './feed-import.service';
import { FeedsController } from './feeds.controller';
import { FeedsScheduler } from './feeds.scheduler';
import { FeedsService } from './feeds.service';

@Module({
  controllers: [FeedsController],
  providers: [FeedsService, FeedFetcherService, FeedImportService, FeedsScheduler],
  exports: [FeedsService, FeedImportService],
})
export class FeedsModule {}
