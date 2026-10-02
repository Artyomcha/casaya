import { IsEmail, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterAgencyDto {
  @IsString() @MinLength(2) @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  /** Inmovilla, Witei, Mobilia… — нужно, чтобы выбрать разборщик фида. */
  @IsOptional() @IsString() @MaxLength(60)
  crm?: string;

  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  feedUrl?: string;

  @IsOptional() @IsString()
  planKey?: string;
}

/**
 * Две цены объекта: рыночная и на Casaya. Обе вводит агент — оценку
 * платформа не считает, она только проверяет разницу.
 */
export class UpdatePricingDto {
  /** Цена на Casaya. */
  @Type(() => Number) @IsInt() @Min(1_000) @Max(100_000_000)
  price: number;

  /** Рыночная цена этого же объекта. null снимает объект с витрины. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1_000) @Max(100_000_000)
  marketPrice?: number | null;
}
