import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AttendanceConfig } from './attendance-config.entity';
import { Role } from '../roles/role.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AttendanceConfigService {

  constructor(
    @InjectRepository(AttendanceConfig)
    private repo: Repository<AttendanceConfig>,

    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) { }

  /*
  ============================
  GET MY CONFIG (staff-safe)
  ============================
  */

  async getMyConfig(user: User) {
    const role = user.roles?.[0];
    if (!role) return { allowOutsideRadius: false, lateThreshold: 0, allowLateCheckIn: true, checkoutReminder1: null, checkoutReminder2: null };
    return this.getConfig(role.id, user);
  }

  /*
  ============================
  GET ROLE CONFIG
  ============================
  */

  async getConfig(roleId: string, currentUser: User) {

    const config = await this.repo.findOne({
      where: {
        role: { id: roleId },
        tenant: { id: currentUser.tenant.id },
      },
      relations: ['role'],
    });

    if (!config) {
      return {
        roleId,
        allowOutsideRadius: false,
        lateThreshold: 0,
        allowLateCheckIn: true,
        checkoutReminder1: null,
        checkoutReminder2: null,
      };
    }

    return config;
  }

  /*
  ============================
  CREATE / UPDATE CONFIG
  ============================
  */

  async saveConfig(
    data: {
      roleId: string;
      allowOutsideRadius: boolean;
      lateThreshold: number;
      allowLateCheckIn?: boolean;
      checkoutReminder1?: string | null;
      checkoutReminder2?: string | null;
    },
    currentUser: User,
  ) {

    const role = await this.roleRepo.findOne({
      where: {
        id: data.roleId,
        tenant: { id: currentUser.tenant.id },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    let config = await this.repo.findOne({
      where: {
        role: { id: role.id },
        tenant: { id: currentUser.tenant.id },
      },
    });

    if (!config) {
      config = this.repo.create({
        role,
        tenant: currentUser.tenant,
      });
    }

    config.allowOutsideRadius = data.allowOutsideRadius;
    config.lateThreshold = data.lateThreshold;
    if (data.allowLateCheckIn !== undefined) config.allowLateCheckIn = data.allowLateCheckIn;
    config.checkoutReminder1 = data.checkoutReminder1 ?? null;
    config.checkoutReminder2 = data.checkoutReminder2 ?? null;

    return this.repo.save(config);
  }

  /*
  ============================
  GET ALL CONFIGS (for cron)
  Used by the checkout reminder cron job
  ============================
  */

  async getAllConfigsForTenant(tenantId: string): Promise<AttendanceConfig[]> {
    return this.repo.find({
      where: { tenant: { id: tenantId } },
      relations: ['role'],
    });
  }
}