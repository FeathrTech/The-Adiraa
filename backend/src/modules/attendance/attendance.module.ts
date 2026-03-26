import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { Attendance } from './attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceCronService } from './attendance-cron.service';

import { AttendanceConfig } from './attendance-config.entity';
import { AttendanceConfigService } from './attendance-config.service';
import { AttendanceConfigController } from './attendance-config.controller';

import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';

import { RealtimeModule } from '../../common/realtime/realtime.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Attendance,
      User,
      Role,
      AttendanceConfig,
    ]),
    RealtimeModule,
  ],
  controllers: [
    AttendanceController,
    AttendanceConfigController,
  ],
  providers: [
    AttendanceService,
    AttendanceConfigService,
    AttendanceCronService,
  ],
  exports: [
    AttendanceService,
    AttendanceConfigService,
  ],
})
export class AttendanceModule { }