import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CatalogModule,
    AgencyModule,
    FeedsModule,
    LeadsModule,
    ValuationModule,
    MortgageModule,
    FavoritesModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
