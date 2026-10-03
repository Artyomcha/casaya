import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { tokenOf, type AuthedRequest } from './auth.guard';
import { assertMember } from './membership';

/**
 * Доступ к кабинету агентства: вход плюс членство именно в этом агентстве.
 *
 * Без второй проверки первой недостаточно: любой вошедший пользователь мог бы
 * открыть чужой кабинет и переписать там цены, зная только идентификатор.
 *
 * Идентификатор агентства берётся из адреса, строки запроса или тела — в CRM
 * он приходит параметром, в кабинете частью пути.
 */
@Injectable()
export class AgencyGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = tokenOf(request);
    if (!token) throw new UnauthorizedException('Нужен вход в Casaya');

    const userId = this.auth.verifyToken(token);
    request.userId = userId;

    await assertMember(this.prisma, agencyIdOf(request), userId);
    return true;
  }
}

function agencyIdOf(request: AuthedRequest): string | null {
  const params = request.params as Record<string, string> | undefined;
  const query = request.query as Record<string, unknown> | undefined;
  const body = request.body as Record<string, unknown> | undefined;

  const candidate =
    params?.agencyId ?? params?.id ?? query?.agencyId ?? body?.agencyId;
  return typeof candidate === 'string' && candidate ? candidate : null;
}
