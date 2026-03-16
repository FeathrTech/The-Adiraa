import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { Department } from './department.entity';
import { Shift } from './shift.entity';
import { Role } from '../roles/role.entity';
import { Location } from '../location/location.entity';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Permission } from '../permissions/permission.entity';
import { RealtimeGateway } from 'src/common/realtime/realtime.gateway';
import { RealtimeModule } from 'src/common/realtime/realtime.module';
import { AttendanceConfig } from '../attendance/attendance-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Department,
      Shift,
      Role,
      Location,
      Permission,
      AttendanceConfig,
    ]),
    RealtimeModule
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
