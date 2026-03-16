import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/user.entity';
import { Session } from '../sessions/session.entity';
import { Tenant } from '../tenant/tenant.entity';
import { Permission } from '../permissions/permission.entity';
import { Role } from '../roles/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session, Tenant, Role,
    Permission,])],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }
