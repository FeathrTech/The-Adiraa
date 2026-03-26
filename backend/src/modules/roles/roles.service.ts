import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Role } from './role.entity';
import { Permission } from '../permissions/permission.entity';
import { User } from '../users/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  /*
  ============================================================
  OWNER PROTECTION HELPERS
  ============================================================
  */

  private async isFullAccessRole(role: Role): Promise<boolean> {
    const totalPermissions = await this.permissionRepo.count();
    return role.permissions.length === totalPermissions;
  }

  private async getFullAccessRoleCount(tenantId: string) {
    const roles = await this.roleRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['permissions'],
    });

    const totalPermissions = await this.permissionRepo.count();

    return roles.filter(
      (r) => r.permissions.length === totalPermissions,
    ).length;
  }

  /*
  ============================================================
  CREATE ROLE
  ============================================================
  */

  async create(name: string, currentUser: User) {
    const exists = await this.roleRepo.findOne({
      where: {
        name,
        tenant: { id: currentUser.tenant.id },
      },
    });

    if (exists) {
      throw new ForbiddenException('Role already exists');
    }

    const role = this.roleRepo.create({
      name,
      tenant: currentUser.tenant,
      permissions: [],
    });

    return this.roleRepo.save(role);
  }

  /*
  ============================================================
  LIST ROLES
  ============================================================
  */

  async findAll(currentUser: User) {
    return this.roleRepo.find({
      where: { tenant: { id: currentUser.tenant.id } },
      relations: ['permissions'],
    });
  }

  /*
  ============================================================
  ASSIGN PERMISSIONS
  ============================================================
  */

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
    currentUser: User,
  ) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, tenant: { id: currentUser.tenant.id } },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions = await this.permissionRepo.find({
      where: { id: In(permissionIds) },
    });

    const totalPermissions = await this.permissionRepo.count();
    const wasFullAccess =
      role.permissions.length === totalPermissions;

    /*
      OWNER PROTECTION:
      Prevent downgrading the only full-access role
    */
    if (
      wasFullAccess &&
      permissions.length < totalPermissions
    ) {
      const fullAccessCount =
        await this.getFullAccessRoleCount(
          currentUser.tenant.id,
        );

      if (fullAccessCount <= 1) {
        throw new ForbiddenException(
          'Cannot downgrade the only full-access role',
        );
      }
    }

    role.permissions = permissions;

    return this.roleRepo.save(role);
  }

  /*
  ============================================================
  ASSIGN ROLE TO USER
  ============================================================
  */

  async assignRoleToUser(
    userId: string,
    roleId: string,
    currentUser: User,
  ) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
        tenant: { id: currentUser.tenant.id },
      },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.roleRepo.findOne({
      where: {
        id: roleId,
        tenant: { id: currentUser.tenant.id },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const alreadyAssigned = user.roles.some(
      (r) => r.id === role.id,
    );

    if (!alreadyAssigned) {
      user.roles.push(role);
      await this.userRepo.save(user);
    }

    return user;
  }

  /*
  ============================================================
  DELETE ROLE
  ============================================================
  */

  async delete(roleId: string, currentUser: User) {
    const role = await this.roleRepo.findOne({
      where: {
        id: roleId,
        tenant: { id: currentUser.tenant.id },
      },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const isFull = await this.isFullAccessRole(role);

    if (isFull) {
      const fullAccessCount =
        await this.getFullAccessRoleCount(
          currentUser.tenant.id,
        );

      if (fullAccessCount <= 1) {
        throw new ForbiddenException(
          'Cannot delete the last full-access role',
        );
      }
    }

    await this.roleRepo.remove(role);

    return { message: 'Role deleted successfully' };
  }

  async findOne(roleId: string, currentUser: User) {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, tenant: { id: currentUser.tenant.id } },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async updateRole(
    roleId: string,
    data: { name?: string; permissionIds?: string[] },
    currentUser: User,
  ) {
    const role = await this.roleRepo.findOne({
      where: {
        id: roleId,
        tenant: { id: currentUser.tenant.id },
      },
      relations: ['permissions'],
    });

    if (!role) throw new NotFoundException('Role not found');

    // ✅ UPDATE NAME
    if (data.name !== undefined) {
      const existing = await this.roleRepo.findOne({
        where: {
          name: data.name,
          tenant: { id: currentUser.tenant.id },
        },
      });

      if (existing && existing.id !== roleId) {
        throw new ForbiddenException('Role already exists');
      }

      role.name = data.name;
    }

    // ✅ UPDATE PERMISSIONS
    if (data.permissionIds) {
      const permissions = await this.permissionRepo.find({
        where: { id: In(data.permissionIds) },
      });

      role.permissions = permissions;
    }

    return this.roleRepo.save(role);
  }

}
