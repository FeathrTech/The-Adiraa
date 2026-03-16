import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { AuditService } from '../../modules/audit/audit.service';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const auditMeta =
      this.reflector.getAllAndOverride<AuditMetadata>(
        AUDIT_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!auditMeta) {
      return next.handle();
    }

    const request: Request & { user?: any } =
      context.switchToHttp().getRequest();

    const user = request.user;

    return next.handle().pipe(
      tap(async (response) => {
        if (!user) return;

        let targetId: string | undefined;

        // Try extracting ID from response
        if (response?.id) {
          targetId = response.id;
        } else if (response?.data?.id) {
          targetId = response.data.id;
        }

        await this.auditService.log(
          auditMeta.module,
          auditMeta.action,
          user,
          targetId,
        );
      }),
    );
  }
}
