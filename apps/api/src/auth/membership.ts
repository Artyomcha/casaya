import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Проверка членства в агентстве — общая для всех guard'ов кабинета.
 * Вынесена отдельно, потому что агентство определяется по-разному:
 * из адреса, из фида, из заявки.
 */
export async function assertMember(
  prisma: PrismaService,
  agencyId: string | null,
  userId: string,
): Promise<void> {
  if (!agencyId) throw new ForbiddenException('Не указано агентство');
  const member = await prisma.agencyMember.findUnique({
    where: { agencyId_userId: { agencyId, userId } },
    select: { id: true },
  });
  if (!member) throw new ForbiddenException('Нет доступа к этому агентству');
}
