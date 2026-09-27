import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FeedImportService } from './feed-import.service';
import { FeedsService } from './feeds.service';

@Injectable()
export class FeedsScheduler {
  private readonly logger = new Logger(FeedsScheduler.name);
  private running = false;

  constructor(
    private readonly feeds: FeedsService,
    private readonly importer: FeedImportService,
  ) {}

  /** Каждые 5 минут забираем фиды, у которых подошёл интервал опроса. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async tick() {
    if (process.env.FEED_SYNC_ENABLED === 'false') return;
    if (this.running) {
      this.logger.warn('Предыдущая синхронизация ещё идёт, пропускаю тик');
      return;
    }

    this.running = true;
    try {
      const due = await this.feeds.due();
      if (!due.length) return;

      this.logger.log(`К синхронизации: ${due.length} фидов`);
      for (const feed of due) {
        try {
          await this.importer.sync(feed.id);
        } catch (err: any) {
          // Ошибка одного фида не должна ронять весь проход.
          this.logger.error(`Фид ${feed.id}: ${err.message}`);
        }
      }
    } finally {
      this.running = false;
    }
  }
}
