import { Global, Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';

@Global()
@Module({
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
