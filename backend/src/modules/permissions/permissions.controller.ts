import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './permission.entity';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('permissions')
export class PermissionsController {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  /**
   * Fetch all system permissions
   * Only users who can assign permissions to roles
   * should be able to see the permission list.
   */
  @Get()
  @RequirePermission('role.assign_permissions')
  async findAll() {
    return this.permissionRepo.find({
      order: { module: 'ASC' },
    });
  }
}
