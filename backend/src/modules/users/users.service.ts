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
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .leftJoinAndSelect('user.locations', 'locations')
      .where('user.tenantId = :tenantId', {
        tenantId: currentUser.tenant.id,
      })
      .addSelect([
        'user.idProofUrl',
        'user.profilePhotoUrl',
        'user.shiftStartTime',
        'user.shiftEndTime',
      ])
      .getMany();
  }

  // ============================================================
  // GET ONE USER
  // ============================================================

  async findOne(id: string, currentUser: User) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .leftJoinAndSelect('user.locations', 'locations')
      .where('user.id = :id', { id })
      .andWhere('user.tenantId = :tenantId', {
        tenantId: currentUser.tenant.id,
      })
      .addSelect(['user.idProofUrl', 'user.profilePhotoUrl'])
      .getOne();
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
  // CREATE USER
  // ============================================================

  async createUser(
    data: {
      name: string;
      mobile: string;
      password: string;
      locationIds?: string[];   // ← now accepts multiple
      locationId?: string;      // ← kept for backward compat (single)
      roleIds: string[];
      profilePhotoUrl?: string;
      idProofUrl?: string;
      shiftStartTime?: string;
      shiftEndTime?: string;
      email?: string;
      allowSelfPhotoUpload?: boolean;  // ← add
      allowSelfIdUpload?: boolean;
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
    LOCATIONS (OPTIONAL — supports both locationIds[] and legacy locationId)
    ============================================================
    */

    let locations: Location[] = [];

    // Normalise: prefer locationIds array, fall back to single locationId
    let parsedLocationIds: string[] = [];

    if (data.locationIds) {
      if (Array.isArray(data.locationIds)) {
        parsedLocationIds = data.locationIds;
      } else if (typeof data.locationIds === 'string') {
        try {
          parsedLocationIds = JSON.parse(data.locationIds);
        } catch {
          throw new ForbiddenException('Invalid locationIds format');
        }
      }
    }
    const incomingIds: string[] = parsedLocationIds.length
      ? parsedLocationIds
      : data.locationId
        ? [data.locationId]
        : [];

    if (incomingIds.length) {
      locations = await this.locationRepo.find({
        where: {
          id: In(incomingIds),
          tenant: { id: tenantId },
        },
      });

      if (!locations.length) {
        throw new NotFoundException('Location(s) not found');
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
      locations,
      roles,
      profilePhotoUrl: data.profilePhotoUrl ?? undefined,
      idProofUrl: data.idProofUrl ?? undefined,
      shiftStartTime: data.shiftStartTime ?? undefined,
      shiftEndTime: data.shiftEndTime ?? undefined,
      isActive: true,
      allowSelfPhotoUpload: data.allowSelfPhotoUpload ?? false,  // ← add
      allowSelfIdUpload: data.allowSelfIdUpload ?? false,
    });

    const savedUser = await this.userRepo.save(user);

    this.realtime.emit('user:created', savedUser);

    return savedUser;
  }

  // ============================================================
  // UPDATE USER
  // ============================================================

  async updateUser(
    userId: string,
    data: {
      name?: string;
      locationId?: string | null;
      locationIds?: string[] | string | null; // 👈 allow string also
      roleIds?: string[];
      isActive?: boolean;
      profilePhotoUrl?: string;
      idProofUrl?: string;
      shiftStartTime?: string;
      shiftEndTime?: string;
      email?: string;
      mobile?: string;
      password?: string;
      allowSelfPhotoUpload?: boolean;  // ← add
      allowSelfIdUpload?: boolean;     // ← add
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
    if (data.allowSelfPhotoUpload !== undefined)
      user.allowSelfPhotoUpload = data.allowSelfPhotoUpload;   // ← add
    if (data.allowSelfIdUpload !== undefined)
      user.allowSelfIdUpload = data.allowSelfIdUpload;

    if (data.mobile !== undefined && data.mobile !== user.mobile) {
      const existingMobile = await this.userRepo.findOne({
        where: {
          mobile: data.mobile,
          tenant: { id: tenantId },
        },
      });

      if (existingMobile && existingMobile.id !== userId) {
        throw new ForbiddenException(
          'Mobile number is already in use by another staff member',
        );
      }

      user.mobile = data.mobile;
    }

    // ============================================================
    // 🔥 FIXED LOCATION UPDATE (handles stringified JSON properly)
    // ============================================================

    let parsedLocationIds: string[] = [];

    if (data.locationIds) {
      if (Array.isArray(data.locationIds)) {
        parsedLocationIds = data.locationIds;
      } else if (typeof data.locationIds === 'string') {
        try {
          parsedLocationIds = JSON.parse(data.locationIds);
        } catch {
          throw new ForbiddenException('Invalid locationIds format');
        }
      }
    }

    const hasMulti = data.locationIds !== undefined;
    const hasSingle = data.locationId !== undefined;

    if (hasMulti) {
      if (!parsedLocationIds.length) {
        user.locations = [];
      } else {
        const locs = await this.locationRepo.find({
          where: {
            id: In(parsedLocationIds),
            tenant: { id: tenantId },
          },
        });

        if (!locs.length) {
          throw new NotFoundException('Location(s) not found');
        }

        user.locations = locs;
      }
    } else if (hasSingle) {
      if (data.locationId === null) {
        user.locations = [];
      } else {
        const location = await this.locationRepo.findOne({
          where: {
            id: data.locationId,
            tenant: { id: tenantId },
          },
        });

        if (!location) {
          throw new NotFoundException('Location not found');
        }

        user.locations = [location];
      }
    }

    // ============================================================
    // ROLE UPDATE
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
        const usersWithFullAccess = await this.userRepo
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

    if (typeof data.isActive === 'boolean') {
      user.isActive = data.isActive;
    }

    await this.userRepo.save(user);

    const updatedUser = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions', 'locations'],
    });

    this.realtime.emit('user:updated', updatedUser);

    return updatedUser;
  }
  // users.service.ts — updateOwnProfilePhoto

  async updateOwnProfilePhoto(userId: string, url: string, currentUser: User) {
    console.log('=== updateOwnProfilePhoto ===');
    console.log('userId:', userId);
    console.log('url:', url);
    console.log('currentUser.tenant:', currentUser?.tenant?.id);  // ← CHECK THIS

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
        tenant: { id: currentUser.tenant.id },
      },
      relations: ['roles', 'roles.permissions', 'locations'],
    });

    console.log('user found:', user ? 'YES' : 'NO');  // ← CHECK THIS
    console.log('allowSelfPhotoUpload:', user?.allowSelfPhotoUpload);  // ← CHECK THIS

    if (!user) throw new NotFoundException('User not found');

    if (!user.allowSelfPhotoUpload) {
      throw new ForbiddenException('Self photo upload not permitted');
    }

    user.profilePhotoUrl = url;

    try {
      await this.userRepo.save(user);
      console.log('save SUCCESS');
    } catch (saveErr) {
      console.error('save FAILED:', saveErr.message);
      throw saveErr;
    }

    const updated = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'locations'],
    });

    console.log('updated user:', updated ? 'YES' : 'NO');

    this.realtime.emit('user:updated', updated);

    return updated;
  }

  // ============================================================
  // SELF UPLOAD — ID PROOF
  // ============================================================
  async updateOwnIdProof(userId: string, url: string, currentUser: User) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
        tenant: { id: currentUser.tenant.id },
      },
      relations: ['roles', 'roles.permissions', 'locations'],
    });

    if (!user) throw new NotFoundException('User not found');

    if (!user.allowSelfIdUpload) {
      throw new ForbiddenException('Self ID upload not permitted');
    }

    user.idProofUrl = url;
    await this.userRepo.save(user);

    const updated = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'locations'],
    });

    this.realtime.emit('user:updated', updated);

    return updated;
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

  // ============================================================
  // GET USER SITE(S)
  // Returns array of all assigned locations with radius config
  // ============================================================

  async getUserSite(currentUser: User) {

    const user = await this.userRepo.findOne({
      where: {
        id: currentUser.id,
        tenant: { id: currentUser.tenant.id },
      },
      relations: ['locations', 'roles'],
    });

    if (!user?.locations?.length) {
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

    // Return all assigned locations so check-in screen can GPS-match
    return user.locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.allowedRadius || 100,
      allowOutsideRadius,
    }));
  }

  // ============================================================
  // PERMANENT DELETE USER
  // ============================================================

  async permanentDeleteUser(id: string, currentUser: User) {
    const user = await this.findOneByTenant(id, currentUser);
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.remove(user);
    this.realtime.emit('user:deleted', id);
    return { success: true };
  }
}