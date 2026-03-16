import { Repository } from 'typeorm';
import { User } from '../../modules/users/user.entity';

export abstract class TenantAwareService<T extends { tenant: any }> {
  constructor(protected readonly repo: Repository<T>) {}

  protected getTenantId(user: User): string {
    if (!user?.tenant?.id) {
      throw new Error('Tenant not found on user');
    }

    return user.tenant.id;
  }

  protected async findAllByTenant(user: User) {
    return this.repo.find({
      where: {
        tenant: { id: this.getTenantId(user) },
      } as any,
    });
  }

  protected async findOneByTenant(id: string, user: User) {
    return this.repo.findOne({
      where: {
        id,
        tenant: { id: this.getTenantId(user) },
      } as any,
    });
  }

  protected async deleteByTenant(id: string, user: User) {
    return this.repo.delete({
      id,
      tenant: { id: this.getTenantId(user) },
    } as any);
  }
}
