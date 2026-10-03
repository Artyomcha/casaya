import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { tokenOf, type AuthedRequest } from './auth.guard';
import { assertMember } from './membership';

/**
 * Доступ к заявке в CRM. Агентство берётся из самой заявки: в пути лежит
 * её идентификатор, и подставить чужой нельзя — членство проверяется
 * у владельца заявки, а не у того, кто её открыл.
 */
@Injectable()
export class LeadGuard implements CanActivate {
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

    const leadId = (request.params as Record<string, string>)?.id;
    const lead = leadId
      ? await this.prisma.lead.findUnique({
          where: { id: leadId },
          select: { agencyId: true, listing: { select: { agencyId: true } } },
        })
      : null;

    await assertMember(this.prisma, lead?.agencyId ?? lead?.listing?.agencyId ?? null, userId);
    return true;
  }
}
