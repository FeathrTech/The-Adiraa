import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AttendanceConfig } from '../modules/attendance/attendance-config.entity';
import { Attendance } from '../modules/attendance/attendance.entity';
import { User } from '../modules/users/user.entity';
import { NotificationService } from './notification.service'; // same folder as this cron

@Injectable()
export class CheckoutReminderCron {

    private readonly logger = new Logger(CheckoutReminderCron.name);

    constructor(
        @InjectRepository(AttendanceConfig)
        private configRepo: Repository<AttendanceConfig>,

        @InjectRepository(Attendance)
        private attendanceRepo: Repository<Attendance>,

        @InjectRepository(User)
        private userRepo: Repository<User>,

        private notificationService: NotificationService,
    ) { }

    @Cron('* * * * *')
    async handleCheckoutReminders() {

        const nowIST = new Date().toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const currentTime = nowIST.slice(0, 5); // "HH:MM"

        this.logger.debug(`Checkout reminder cron running at IST ${currentTime}`);

        const configs = await this.configRepo.find({
            relations: ['role', 'tenant'],
        });

        for (const config of configs) {

            const isReminder1 = config.checkoutReminder1 === currentTime;
            const isReminder2 = config.checkoutReminder2 === currentTime;

            if (!isReminder1 && !isReminder2) continue;

            const todayIST = new Date().toLocaleDateString('en-CA', {
                timeZone: 'Asia/Kolkata',
            });

            const checkedInAttendances = await this.attendanceRepo
                .createQueryBuilder('a')
                .innerJoinAndSelect('a.user', 'user')
                .innerJoin('user.roles', 'role')
                .where('a.tenantId = :tenantId', { tenantId: config.tenant.id })
                .andWhere('role.id = :roleId', { roleId: config.role.id })
                .andWhere('a.attendanceDate = :date', { date: todayIST })
                .andWhere('a.checkInTime IS NOT NULL')
                .andWhere('a.checkOutTime IS NULL')
                .getMany();

            if (checkedInAttendances.length === 0) continue;

            const userIds = checkedInAttendances.map((a) => a.user.id);

            // ✅ Fixed — only fetch users who actually have the config's role
            const users = await this.userRepo
                .createQueryBuilder('u')
                .innerJoin('u.roles', 'role')
                .where('u.id IN (:...ids)', { ids: userIds })
                .andWhere('role.id = :roleId', { roleId: config.role.id })
                .andWhere('u.pushToken IS NOT NULL')
                .getMany();

            // ── DEBUG: log exactly who is getting notified ──
            this.logger.log(
                `Users selected for reminder: ${users.map(u => `${u.name} (${u.id})`).join(', ')}`
            );

            const tokens = users.map((u) => u.pushToken).filter((t): t is string => !!t);

            if (tokens.length === 0) continue;

            this.logger.log(
                `Sending checkout reminder to ${tokens.length} user(s) ` +
                `[role: ${config.role.name}, tenant: ${config.tenant.id}] at ${currentTime}`,
            );

            await this.notificationService.sendPushNotification(
                tokens,
                'Checkout Reminder',
                "Don't forget to check out before you leave.",
                { type: 'checkout-reminder' },
            );
        }
    }
}