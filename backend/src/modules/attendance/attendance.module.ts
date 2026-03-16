import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Attendance } from './attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

import { AttendanceConfig } from './attendance-config.entity';
import { AttendanceConfigService } from './attendance-config.service';
import { AttendanceConfigController } from './attendance-config.controller';

import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';

import { RealtimeModule } from '../../common/realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      User,
      Role,
      AttendanceConfig,
    ]),
    RealtimeModule,   // ⭐ ADD THIS
  ],

  controllers: [
    AttendanceController,
    AttendanceConfigController,
  ],

  providers: [
    AttendanceService,
    AttendanceConfigService,
  ],

  exports: [
    AttendanceService,
    AttendanceConfigService,
  ],
})
export class AttendanceModule {}