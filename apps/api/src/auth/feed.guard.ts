import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { tokenOf, type AuthedRequest } from './auth.guard';
import { assertMember } from './membership';

/**
 * Доступ к фиду. Агентство определяется не из адреса, а по самому фиду:
 * в пути лежит его идентификатор, а не идентификатор агентства.
 */
@Injectable()
export class FeedGuard implements CanActivate {
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

    const feedId = (request.params as Record<string, string>)?.id;
    const feed = feedId
      ? await this.prisma.agencyFeed.findUnique({
          where: { id: feedId },
          select: { agencyId: true },
        })
      : null;

    await assertMember(this.prisma, feed?.agencyId ?? null, userId);
    return true;
  }
}
