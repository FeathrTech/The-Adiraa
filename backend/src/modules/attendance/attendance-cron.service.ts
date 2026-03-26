import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Attendance } from './attendance.entity';

@Injectable()
export class AttendanceCronService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Attendance)
        private attendanceRepo: Repository<Attendance>,
    ) { }

    // 00:01 AM IST = 18:31 UTC
    @Cron('31 18 * * *', { timeZone: 'UTC' })
    async autoMarkAbsent() {

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const targetDate = yesterday.toLocaleDateString('en-CA', {
            timeZone: 'Asia/Kolkata',
        });

        const allStaff = await this.userRepo.find({
            relations: ['tenant'],
        });

        for (const staff of allStaff) {
            const createdDay = new Date(staff.createdAt)
                .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

            // Skip staff who didn't exist on that date
            if (createdDay > targetDate) continue;

            const existing = await this.attendanceRepo.findOne({
                where: {
                    user: { id: staff.id },
                    tenant: { id: staff.tenant.id },
                    attendanceDate: targetDate,
                },
            });

            // Only create absent record if no record exists at all
            if (!existing) {
                await this.attendanceRepo.save(
                    this.attendanceRepo.create({
                        user: { id: staff.id },
                        tenant: { id: staff.tenant.id },
                        attendanceDate: targetDate,
                        isAbsent: true,
                    }),
                );
            }
        }

        console.log(`[Cron] Midnight sweep complete for: ${targetDate}`);
    }
}