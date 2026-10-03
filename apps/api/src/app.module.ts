import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CatalogModule } from './catalog/catalog.module';
import { LeadsModule } from './leads/leads.module';
import { ValuationModule } from './valuation/valuation.module';
import { MortgageModule } from './mortgage/mortgage.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { FeedsModule } from './feeds/feeds.module';
import { AgencyModule } from './agency/agency.module';
import { PropertiesModule } from './properties/properties.module';
import { RankingModule } from './ranking/ranking.module';
import { PromotionsModule } from './promotions/promotions.module';
import { CrmModule } from './crm/crm.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Ограничение частоты на весь API. Витрину 120 запросов в минуту не
    // стесняют, а перебор кода входа и накрутку показов останавливают.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    PropertiesModule,
    RankingModule,
    CatalogModule,
    AgencyModule,
    FeedsModule,
    PromotionsModule,
    CrmModule,
    UploadsModule,
    LeadsModule,
    ValuationModule,
    MortgageModule,
    FavoritesModule,
    AuthModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
