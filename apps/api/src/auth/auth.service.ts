import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

interface PendingCode {
  code: string;
  expiresAt: number;
}

const CODE_TTL_MS = 5 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Вход по одноразовому коду на телефон или email — как в модальном окне портала.
 * Отправка кода здесь заглушена: на проде сюда подключается SMS/email-провайдер.
 */
@Injectable()
export class AuthService {
  private readonly codes = new Map<string, PendingCode>();
  private readonly secret = process.env.AUTH_SECRET ?? 'casaya-dev-secret';

  constructor(private readonly prisma: PrismaService) {}

  requestCode(channel: 'phone' | 'email', identity: string) {
    const key = `${channel}:${identity.trim().toLowerCase()}`;
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    this.codes.set(key, { code, expiresAt: Date.now() + CODE_TTL_MS });

    return {
      sent: true,
      channel,
      expiresInSec: CODE_TTL_MS / 1000,
      // В dev-режиме код возвращается, чтобы можно было пройти сценарий без провайдера.
      devCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  async verify(channel: 'phone' | 'email', identity: string, code: string) {
    const key = `${channel}:${identity.trim().toLowerCase()}`;
    const pending = this.codes.get(key);
    if (!pending) throw new BadRequestException('Код не запрашивался или устарел');
    if (pending.expiresAt < Date.now()) {
      this.codes.delete(key);
      throw new BadRequestException('Срок действия кода истёк');
    }
    const a = Buffer.from(pending.code);
    const b = Buffer.from(code.padEnd(a.length).slice(0, a.length));
    if (!timingSafeEqual(a, b)) throw new UnauthorizedException('Неверный код');

    this.codes.delete(key);
    const where = channel === 'phone' ? { phone: identity } : { email: identity };
    const user = await this.prisma.user.upsert({
      where: where as any,
      update: {},
      create: where,
    });

    return { token: this.sign(user.id), user };
  }

  sign(userId: string) {
    const exp = Date.now() + TOKEN_TTL_MS;
    const body = `${userId}.${exp}`;
    const sig = createHmac('sha256', this.secret).update(body).digest('base64url');
    return `${Buffer.from(body).toString('base64url')}.${sig}`;
  }

  verifyToken(token: string): string {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) throw new UnauthorizedException('Некорректный токен');
    const body = Buffer.from(payload, 'base64url').toString();
    const expected = createHmac('sha256', this.secret).update(body).digest('base64url');
    if (expected !== sig) throw new UnauthorizedException('Подпись токена не совпадает');
    const [userId, exp] = body.split('.');
    if (Number(exp) < Date.now()) throw new UnauthorizedException('Токен истёк');
    return userId;
  }
}
