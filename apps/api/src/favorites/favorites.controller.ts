import { Body, Controller, Get, Headers, Param, Post, UnauthorizedException } from '@nestjs/common';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';
import { AuthService } from '../auth/auth.service';
import { FavoritesService } from './favorites.service';

class MergeDto {
  @IsArray() @ArrayMaxSize(500) @IsString({ each: true })
  listingIds: string[];
}

@Controller('favorites')
export class FavoritesController {
  constructor(
    private readonly favorites: FavoritesService,
    private readonly auth: AuthService,
  ) {}

  private userId(header?: string) {
    const token = header?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Нужен вход в Casaya');
    return this.auth.verifyToken(token);
  }

  @Get()
  list(@Headers('authorization') header?: string) {
    return this.favorites.list(this.userId(header));
  }

  @Post(':listingId/toggle')
  toggle(@Param('listingId') listingId: string, @Headers('authorization') header?: string) {
    return this.favorites.toggle(this.userId(header), listingId);
  }

  @Post('merge')
  merge(@Body() dto: MergeDto, @Headers('authorization') header?: string) {
    return this.favorites.merge(this.userId(header), dto.listingIds);
  }
}
