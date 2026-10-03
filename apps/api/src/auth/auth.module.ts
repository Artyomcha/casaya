import { Global, Module } from '@nestjs/common';
import { AgencyGuard } from './agency.guard';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { FeedGuard } from './feed.guard';
import { LeadGuard } from './lead.guard';
import { AuthService } from './auth.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AgencyGuard, FeedGuard, LeadGuard],
  exports: [AuthService, AuthGuard, AgencyGuard, FeedGuard, LeadGuard],
})
export class AuthModule {}
