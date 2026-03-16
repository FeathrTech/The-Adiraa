import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationService } from './notification.service';
import { CheckoutReminderCron } from './checkout-reminder.cron';

import { AttendanceConfig } from '../modules/attendance/attendance-config.entity';
import { Attendance } from '../modules/attendance/attendance.entity';
import { User } from '../modules/users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([AttendanceConfig, Attendance, User]),
    ],
    providers: [
        NotificationService,
        CheckoutReminderCron,
    ],
    exports: [NotificationService], // export so other modules can inject it if needed
})
export class CronModule { }