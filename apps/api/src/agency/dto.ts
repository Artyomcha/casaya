import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

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
