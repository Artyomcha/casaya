import { Global, Module } from '@nestjs/common';
import { FootprintService } from './footprint.service';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Global()
@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, FootprintService],
  exports: [PropertiesService, FootprintService],
})
export class PropertiesModule {}
