import { LeadKind } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLeadDto {
  @IsEnum(LeadKind)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  kind: LeadKind;

  @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(80)
  country?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  message?: string;

  @IsOptional() @IsString()
  listingId?: string;

  /** Произвольный контекст формы: выбранный тариф, услуга, параметры расчёта. */
  @IsOptional() @IsObject()
  payload?: Record<string, unknown>;
}
