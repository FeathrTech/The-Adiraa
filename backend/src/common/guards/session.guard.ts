import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';

import { Session } from '../../modules/sessions/session.entity';
import { hashToken } from '../utils/token.util';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const rawToken = authHeader.split(' ')[1];
    const tokenHash = hashToken(rawToken);

    const session = await this.sessionRepo.findOne({
      where: { tokenHash, revoked: false },
      relations: [
        'user',
        'user.roles',
        'user.roles.permissions',
        'user.tenant',
        'user.locations',
      ],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    const now = new Date();

    if (session.expiresAt < now) {
      throw new UnauthorizedException('Session expired');
    }

    // 🔥 Optimized Sliding Session Logic
    // Only update if last activity was more than 1 hour ago
    const ONE_HOUR = 60 * 60 * 1000;

    if (now.getTime() - session.lastActiveAt.getTime() > ONE_HOUR) {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 90);

      session.expiresAt = newExpiry;
      session.lastActiveAt = now;

      await this.sessionRepo.save(session);
    }

    // 🔐 Attach user + tenant context
    request.user = {
      ...session.user,
      tenantId: session.user.tenant?.id,   // ← now accessible as req.user.tenantId
      locationId: session.user.locations?.[0]?.id,
    };
    request.tenantId = session.user.tenant?.id;   // keep for backward compat
    request.locationId = session.user.locations?.[0]?.id;

    return true;
  }
}
