import { FeedFormat } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class PreviewFeedDto {
  // require_tld отключён ради staging-хостов агентств; от SSRF защищает
  // проверка адреса в FeedFetcherService, а не этот валидатор.
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  url: string;

  @IsOptional() @IsEnum(FeedFormat)
  format?: FeedFormat;
}

export class ConnectFeedDto extends PreviewFeedDto {
  @IsString()
  agencyId: string;

  /** Как часто опрашивать фид, минут. По умолчанию раз в час. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(15) @Max(1440)
  intervalMin?: number;

  @IsOptional() @IsBoolean()
  syncNow?: boolean;
}
