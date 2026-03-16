import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ENTITIES
import { Tenant } from './modules/tenant/tenant.entity';
import { Location } from './modules/location/location.entity';
import { Permission } from './modules/permissions/permission.entity';
import { Role } from './modules/roles/role.entity';
import { User } from './modules/users/user.entity';
import { Session } from './modules/sessions/session.entity';
import { Department } from './modules/users/department.entity';
import { Shift } from './modules/users/shift.entity';
import { Attendance } from './modules/attendance/attendance.entity';
import { Event } from './modules/events/event.entity';
import { Setting } from './modules/settings/setting.entity';
import { Hall } from './modules/hall/hall.entity';

// MODULES
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { EventsModule } from './modules/events/events.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocationModule } from './modules/location/location.module';
import { AuditModule } from './modules/audit/audit.module';
import { HallModule } from './modules/hall/hall.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron.module';

import { AuditLog } from './modules/audit/audit-log.entity';


// GUARDS
import { SessionGuard } from './common/guards/session.guard';
import { PermissionGuard } from './common/guards/permission.guard';

// SEED
import { seedPermissions } from './modules/permissions/permission.seed';
import { RealtimeGateway } from './common/realtime/realtime.gateway';
import { AttendanceConfig } from './modules/attendance/attendance-config.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CronModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        Tenant,
        Permission,
        Role,
        User,
        Session,
        Department,
        Shift,
        Attendance,
        Event,
        Setting,
        Location,
        Hall,
        AuditLog,
        AttendanceConfig,
      ],
      synchronize: true,
      migrationsRun: false,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
    }),

    PermissionsModule,
    RolesModule,
    UsersModule,
    SessionsModule,
    AttendanceModule,
    EventsModule,
    SettingsModule,
    AuthModule,
    LocationModule,
    AuditModule,
    HallModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    RealtimeGateway,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) { }

  async onModuleInit() {
    console.log('🚀 Bootstrapping system...');

    const tenantRepo = this.dataSource.getRepository(Tenant);
    const permissionRepo = this.dataSource.getRepository(Permission);
    const roleRepo = this.dataSource.getRepository(Role);
    const userRepo = this.dataSource.getRepository(User);

    // 1️⃣ Seed permissions (only if empty)
    if ((await permissionRepo.count()) === 0) {
      console.log('🌱 Seeding permissions...');
      await seedPermissions(this.dataSource);
    }

    // 2️⃣ Create default testing tenant
    let tenant = await tenantRepo.findOne({
      where: { name: 'Default Tenant' },
    });

    if (!tenant) {
      const slug = 'default';

      tenant = tenantRepo.create({
        name: 'Default Tenant',
        slug,
      });

      await tenantRepo.save(tenant);
      console.log('✅ Default testing tenant created');
    }

    // 3️⃣ Create owner role if not exists
    let ownerRole = await roleRepo.findOne({
      where: {
        name: 'Owner',
        tenant: { id: tenant.id },
      },
      relations: ['permissions'],
    });

    if (!ownerRole) {
      const allPermissions = await permissionRepo.find();

      ownerRole = roleRepo.create({
        name: 'Owner',
        tenant,
        permissions: allPermissions,
      });

      await roleRepo.save(ownerRole);
      console.log('✅ Owner role created');
    }

    // 4️⃣ Create owner user if not exists
    const existingOwner = await userRepo.findOne({
      where: {
        mobile: '9999999999',
        tenant: { id: tenant.id },
      },
    });

    if (!existingOwner) {
      const hashedPassword = await bcrypt.hash('123456', 10);

      const username = `testowner@${tenant.slug}`;

      const ownerUser = userRepo.create({
        name: 'Test Owner',
        username,
        mobile: '9999999999',
        password: hashedPassword,
        tenant,
        roles: [ownerRole],
      });

      await userRepo.save(ownerUser);
      console.log('✅ Test owner user created');
    }

    console.log('🎉 Testing bootstrap complete');
  }
}

