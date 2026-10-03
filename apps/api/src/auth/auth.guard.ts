import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

/** Запрос, прошедший проверку токена: дальше по цепочке лежит id пользователя. */
export interface AuthedRequest extends Request {
  userId?: string;
}

/** Достаёт токен из заголовка. Схема одна — Bearer. */
export function tokenOf(request: AuthedRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

/**
 * Вход обязателен. Guard кладёт id пользователя в запрос, чтобы следующие
 * проверки и контроллеры не разбирали заголовок заново.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(protected readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const token = tokenOf(request);
    if (!token) throw new UnauthorizedException('Нужен вход в Casaya');
    request.userId = this.auth.verifyToken(token);
    return true;
  }
}
