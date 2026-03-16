import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { Location } from '../location/location.entity';
import { Permission } from '../permissions/permission.entity';
import { TenantAwareService } from '../../common/base/tenant-aware.service';
import { RealtimeGateway } from 'src/common/realtime/realtime.gateway';
import { AttendanceConfig } from '../attendance/attendance-config.entity';

@Injectable()
export class UsersService extends TenantAwareService<User> {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,

    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,

    @InjectRepository(AttendanceConfig)
    private configRepo: Repository<AttendanceConfig>,

    private realtime: RealtimeGateway,
  ) {
    super(userRepo);
  }

  // ============================================================
  // GET ALL USERS
  // ============================================================

  async findAll(currentUser: User) {
    return this.userRepo.find({
      where: { tenant: { id: currentUser.tenant.id } },
      relations: ['roles', 'roles.permissions', 'location'],
    });
  }

  // ============================================================
  // GET ONE USER
  // ============================================================

  async findOne(id: string, currentUser: User) {
    const user = await this.findOneByTenant(id, currentUser);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ============================================================
  // SAVE PUSH TOKEN
  // ============================================================

  async updatePushToken(userId: string, pushToken: string) {
    await this.userRepo.update(userId, { pushToken });
    return { success: true };
  }

  // ============================================================
  // CREATE USER (UPDATED)
  // ============================================================

  async createUser(
    data: {
      name: string;
      mobile: string;
      password: string;
      locationId?: string;
      roleIds: string[];
      profilePhotoUrl?: string;
      idProofUrl?: string;
      shiftStartTime?: string;
      shiftEndTime?: string;
      email?: string;
    },
    currentUser: User,
  ) {
    const tenantId = this.getTenantId(currentUser);
    const tenantSlug = currentUser.tenant.slug;

    // 🔐 Check duplicate mobile (tenant scoped)
    const existingMobile = await this.userRepo.findOne({
      where: {
        mobile: data.mobile,
        tenant: { id: tenantId },
      },
    });

    if (existingMobile) {
      throw new ForbiddenException('Mobile already exists');
    }

    if (!data.roleIds || !data.roleIds.length) {
      throw new ForbiddenException('User must have at least one role');
    }

    /*
    ============================================================
    🔥 AUTO GENERATE USERNAME (name@tenantSlug)
    ============================================================
    */

    const base = data.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    let username = `${base}@${tenantSlug}`;
    let counter = 1;

    while (await this.userRepo.findOne({ where: { username } })) {
      username = `${base}${counter}@${tenantSlug}`;
      counter++;
    }

    /*
    ============================================================
    LOCATION (OPTIONAL)
    ============================================================
    */

    let location: Location | null = null;

    if (data.locationId) {
      location = await this.locationRepo.findOne({
        where: {
          id: data.locationId,
          tenant: { id: tenantId },
        },
      });

      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    /*
    ============================================================
    ROLES (TENANT SAFE)
    ============================================================
    */

    const roles = await this.roleRepo.find({
      where: {
        id: In(data.roleIds),
        tenant: { id: tenantId },
      },
      relations: ['permissions'],
    });

    if (!roles.length) {
      throw new NotFoundException('Roles not found');
    }

    /*
    ============================================================
    PASSWORD HASHING
    ============================================================
    */

    const hashedPassword = await bcrypt.hash(data.password, 10);

    /*
    ============================================================
    CREATE USER
    ============================================================
    */

    const user = this.userRepo.create({
      name: data.name,
      username,
      mobile: data.mobile,
      email: data.email ?? undefined,
      password: hashedPassword,
      tenant: currentUser.tenant,
      location: location ?? null,
      roles,
      profilePhotoUrl: data.profilePhotoUrl ?? undefined,
      idProofUrl: data.idProofUrl ?? undefined,
      shiftStartTime: data.shiftStartTime ?? undefined,
      shiftEndTime: data.shiftEndTime ?? undefined,
      isActive: true,
    });

    const savedUser = await this.userRepo.save(user);

    this.realtime.emit('user:created', savedUser);

    return savedUser;
  }

  // ============================================================
  // UPDATE USER (UPDATED)
  // ============================================================

  async updateUser(
    userId: string,
    data: {
      name?: string;
      locationId?: string | null;
      roleIds?: string[];
      isActive?: boolean;
      profilePhotoUrl?: string;
      idProofUrl?: string;
      shiftStartTime?: string;
      shiftEndTime?: string;
      email?: string;
    },
    currentUser: User,
  ) {
    const tenantId = currentUser.tenant.id;

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
        tenant: { id: tenantId },
      },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) throw new NotFoundException('User not found');

    // 🔄 BASIC UPDATES
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.shiftStartTime !== undefined)
      user.shiftStartTime = data.shiftStartTime;
    if (data.shiftEndTime !== undefined)
      user.shiftEndTime = data.shiftEndTime;
    if (data.profilePhotoUrl !== undefined)
      user.profilePhotoUrl = data.profilePhotoUrl;
    if (data.idProofUrl !== undefined)
      user.idProofUrl = data.idProofUrl;

    // ============================================================
    // LOCATION UPDATE (OPTIONAL / REMOVABLE)
    // ============================================================

    if (data.locationId !== undefined) {
      if (data.locationId === null) {
        user.location = null;
      } else {
        const location = await this.locationRepo.findOne({
          where: {
            id: data.locationId,
            tenant: { id: tenantId },
          },
        });

        if (!location)
          throw new NotFoundException('Location not found');

        user.location = location;
      }
    }

    // ============================================================
    // ROLE UPDATE (WITH LAST FULL ACCESS PROTECTION)
    // ============================================================

    if (data.roleIds) {
      if (!data.roleIds.length) {
        throw new ForbiddenException('User must have at least one role');
      }

      const roles = await this.roleRepo.find({
        where: {
          id: In(data.roleIds),
          tenant: { id: tenantId },
        },
        relations: ['permissions'],
      });

      if (!roles.length) {
        throw new NotFoundException('Roles not found');
      }

      const totalPermissions = await this.permissionRepo.count();

      const hadFullAccess = user.roles.some(
        (r) => r.permissions.length === totalPermissions,
      );

      if (hadFullAccess) {
        const usersWithFullAccess =
          await this.userRepo
            .createQueryBuilder('user')
            .leftJoin('user.roles', 'role')
            .leftJoin('role.permissions', 'permission')
            .groupBy('user.id')
            .having('COUNT(permission.id) = :count', {
              count: totalPermissions,
            })
            .getCount();

        const stillHasFullAccess = roles.some(
          (r) => r.permissions.length === totalPermissions,
        );

        if (usersWithFullAccess <= 1 && !stillHasFullAccess) {
          throw new ForbiddenException(
            'Cannot remove last full-access user',
          );
        }
      }

      user.roles = roles;
    }

    if (typeof data.isActive === 'boolean')
      user.isActive = data.isActive;

    await this.userRepo.save(user);

    const updatedUser = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions', 'location'],
    });

    this.realtime.emit('user:updated', updatedUser);

    return updatedUser;
  }

  // ============================================================
  // DEACTIVATE USER
  // ============================================================

  async deactivateUser(id: string, currentUser: User) {
    const user = await this.findOneByTenant(id, currentUser);

    if (!user) throw new NotFoundException('User not found');

    user.isActive = false;

    const updatedUser = await this.userRepo.save(user);

    this.realtime.emit('user:deleted', id);

    return updatedUser;
  }

  async getUserSite(currentUser: User) {

    const user = await this.userRepo.findOne({
      where: {
        id: currentUser.id,
        tenant: { id: currentUser.tenant.id },
      },
      relations: ['location', 'roles'],
    });

    if (!user?.location) {
      return null;
    }

    const role = user.roles?.[0];

    let allowOutsideRadius = false;

    if (role) {

      const config = await this.configRepo.findOne({
        where: {
          role: { id: role.id },
          tenant: { id: currentUser.tenant.id },
        },
      });

      allowOutsideRadius = config?.allowOutsideRadius ?? false;
    }

    return {
      id: user.location.id,
      name: user.location.name,
      latitude: user.location.latitude,
      longitude: user.location.longitude,
      radius: user.location.allowedRadius || 100,
      allowOutsideRadius,
    };
  }
}