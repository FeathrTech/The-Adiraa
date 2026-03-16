import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/user.entity';
import { Session } from '../sessions/session.entity';
import { Tenant } from '../tenant/tenant.entity';
import { Role } from '../roles/role.entity';
import { Permission } from '../permissions/permission.entity';

import { generateToken, hashToken } from '../../common/utils/token.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,

    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,

    @InjectRepository(Role)
    private roleRepo: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) { }

  // =====================================================
  // LOGIN (USERNAME + PASSWORD)
  // =====================================================

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions', 'tenant', 'location'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User inactive');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const session = this.sessionRepo.create({
      tokenHash,
      user,
      expiresAt,
      lastActiveAt: new Date(),
    });

    await this.sessionRepo.save(session);

    return {
      token: rawToken,
      user,
    };
  }
  async logout(rawToken: string): Promise<void> {
    if (!rawToken) return;

    const tokenHash = hashToken(rawToken);

    const session = await this.sessionRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (session?.user?.id) {
      await this.userRepo.update(session.user.id, { pushToken: null });
      await this.sessionRepo.delete({ tokenHash });
    }
  }
  // =====================================================
  // REGISTER TENANT (OWNER SIGNUP)
  // =====================================================

  async registerTenant(data: {
    companyName: string;
    name: string;
    mobile: string;
    password: string;
  }) {
    // 1️⃣ Generate slug
    const slug = data.companyName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    // 2️⃣ Prevent duplicate tenant slug
    const existingTenant = await this.tenantRepo.findOne({
      where: { slug },
    });

    if (existingTenant) {
      throw new ForbiddenException('Company already exists');
    }

    // 3️⃣ Create tenant
    const tenant = this.tenantRepo.create({
      name: data.companyName,
      slug,
    });

    await this.tenantRepo.save(tenant);

    // 4️⃣ Get all permissions
    const allPermissions = await this.permissionRepo.find();

    // 5️⃣ Create owner role
    const ownerRole = this.roleRepo.create({
      name: 'Owner',
      tenant,
      permissions: allPermissions,
    });

    await this.roleRepo.save(ownerRole);

    // 6️⃣ Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 7️⃣ Generate owner username = name@slug
    const base = data.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    let username = `${base}@${slug}`;
    let counter = 1;

    while (await this.userRepo.findOne({ where: { username } })) {
      username = `${base}${counter}@${slug}`;
      counter++;
    }

    // 8️⃣ Create owner user
    const user = this.userRepo.create({
      name: data.name,
      username,
      mobile: data.mobile,
      password: hashedPassword,
      tenant,
      roles: [ownerRole],
      isActive: true,
    });

    await this.userRepo.save(user);

    // 9️⃣ Auto login owner
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const session = this.sessionRepo.create({
      tokenHash,
      user,
      expiresAt,
      lastActiveAt: new Date(),
    });

    await this.sessionRepo.save(session);

    return {
      token: rawToken,
      user,
    };
  }
}