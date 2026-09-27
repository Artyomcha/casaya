import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { IsEnum, IsString, Length, MaxLength } from 'class-validator';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

class RequestCodeDto {
  @IsEnum(['phone', 'email'] as const)
  channel: 'phone' | 'email';

  @IsString() @MaxLength(120)
  identity: string;
}

class VerifyCodeDto extends RequestCodeDto {
  @IsString() @Length(6, 6)
  code: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('request-code')
  requestCode(@Body() dto: RequestCodeDto) {
    return this.auth.requestCode(dto.channel, dto.identity);
  }

  @Post('verify')
  verify(@Body() dto: VerifyCodeDto) {
    return this.auth.verify(dto.channel, dto.identity, dto.code);
  }

  @Get('me')
  async me(@Headers('authorization') header?: string) {
    const token = header?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Нет токена');
    const userId = this.auth.verifyToken(token);
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }
}
