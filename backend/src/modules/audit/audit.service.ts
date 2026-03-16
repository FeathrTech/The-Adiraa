import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    module: string,
    action: string,
    user: User,
    targetId?: string,
    metadata?: Record<string, any>,
  ) {
    const audit = this.auditRepo.create({
      module,
      action,
      user,
      tenant: user?.tenant,
      targetId,
      metadata,
    });

    await this.auditRepo.save(audit);
  }
}
