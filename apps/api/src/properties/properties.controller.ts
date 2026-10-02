import { Controller, Get, Param } from '@nestjs/common';
import { FootprintService } from './footprint.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly footprints: FootprintService) {}

  /** Контур дома для 3D-вида. Отсутствие контура — не ошибка, а пустой ответ. */
  @Get(':id/footprint')
  footprint(@Param('id') id: string) {
    return this.footprints.forProperty(id);
  }
}
