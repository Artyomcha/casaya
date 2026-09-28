import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServiceScope } from '@prisma/client';
import { CatalogService } from './catalog.service';
import { ListingQueryDto } from './dto';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('listings')
  listings(@Query() query: ListingQueryDto) {
    return this.catalog.listings(query);
  }

  @Get('listings/duplicate-stats')
  duplicateStats() {
    return this.catalog.duplicateStats();
  }

  @Get('properties/:id/offers')
  offers(@Param('id') id: string) {
    return this.catalog.offers(id);
  }

  @Get('listings/map-pins')
  pins() {
    return this.catalog.mapPins();
  }

  @Get('listings/:idOrSlug')
  listing(@Param('idOrSlug') idOrSlug: string) {
    return this.catalog.listing(idOrSlug);
  }

  @Get('listings/:idOrSlug/similar')
  similar(@Param('idOrSlug') idOrSlug: string) {
    return this.catalog.similar(idOrSlug);
  }

  @Get('projects')
  projects(@Query('year') year?: string) {
    return this.catalog.projects(year);
  }

  @Get('projects/:slug')
  project(@Param('slug') slug: string) {
    return this.catalog.project(slug);
  }

  @Get('cities')
  cities() {
    return this.catalog.cities();
  }

  @Get('banks')
  banks() {
    return this.catalog.banks();
  }

  @Get('plans')
  plans() {
    return this.catalog.plans();
  }

  @Get('services')
  services(@Query('scope') scope?: ServiceScope) {
    return this.catalog.services(scope);
  }

  @Get('agencies')
  agencies() {
    return this.catalog.agencies();
  }
}
