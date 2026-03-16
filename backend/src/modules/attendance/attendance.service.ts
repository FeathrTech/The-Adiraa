import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { Attendance } from './attendance.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';

import { uploadToR2 } from '../../common/utils/r2.service';
import { AttendanceConfig } from './attendance-config.entity';
import { RealtimeGateway } from '../../common/realtime/realtime.gateway';
import { Not, IsNull } from 'typeorm';


type StaffAttendanceDto = {
  id: string;
  attendanceId: string | null;
  name: string;
  roles: Role[];
  status: 'Present' | 'Late' | 'Absent';
};

@Injectable()
export class AttendanceService {

  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(AttendanceConfig)
    private configRepo: Repository<AttendanceConfig>,

    private realtimeGateway: RealtimeGateway,
  ) { }
  // ============================
  // IST DAY BOUNDARIES
  // ============================

  private getISTDayBounds(date?: string) {

    const now = date ? new Date(date) : new Date();

    const ist = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    );

    const start = new Date(ist);
    start.setHours(0, 0, 0, 0);

    const end = new Date(ist);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  // ============================
  // GET TODAY STATUS
  // ============================

  async getTodayStatus(user: User) {

    const { start, end } = this.getISTDayBounds();

    const attendance = await this.attendanceRepo.findOne({
      where: {
        user: { id: user.id },
        tenant: { id: user.tenant.id },
        createdAt: Between(start, end),
      },
      relations: ['location'],
    });

    if (!attendance) {
      return {
        checkedIn: false,
        checkedOut: false,
      };
    }

    const now = new Date();

    let workingMinutes = 0;

    if (attendance.checkInTime) {

      const endTime =
        attendance.checkOutTime ?? now;

      workingMinutes =
        (endTime.getTime() -
          attendance.checkInTime.getTime()) /
        (1000 * 60);
    }

    return {
      checkedIn: !!attendance.checkInTime,
      checkedOut: !!attendance.checkOutTime,
      isLate: attendance.isLate,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      workingMinutes: Math.floor(workingMinutes),
    };
  }

  // ============================
  // ADMIN DASHBOARD
  // ============================

  async getDashboard(
    date: string,
    filter: string,
    user: User,
  ) {

    const { start, end } =
      this.getISTDayBounds(date);

    const tenantId = user.tenant.id;

    const attendances =
      await this.attendanceRepo.find({
        where: {
          tenant: { id: tenantId },
          createdAt: Between(start, end),
        },
        relations: ['user', 'user.roles'],
      });

    const allStaff =
      await this.userRepo.find({
        where: {
          tenant: { id: tenantId },
        },
        relations: ['roles'],
      });

    const presentIds =
      attendances.map((a) => a.user.id);

    let staff: StaffAttendanceDto[] = [];

    if (filter === 'present') {

      staff = attendances
        .filter((a) => a.checkInTime)
        .map((a) => ({
          id: a.user.id,
          attendanceId: a.id,
          name: a.user.name,
          roles: a.user.roles,
          status: a.isLate ? 'Late' : 'Present',
        }));
    }

    else if (filter === 'late') {

      staff = attendances
        .filter((a) => a.isLate)
        .map((a) => ({
          id: a.user.id,
          attendanceId: a.id,
          name: a.user.name,
          roles: a.user.roles,
          status: 'Late',
        }));
    }

    else if (filter === 'absent') {

      staff = allStaff
        .filter((u) => !presentIds.includes(u.id))
        .map((u) => ({
          id: u.id,
          attendanceId: null,
          name: u.name,
          roles: u.roles,
          status: 'Absent',
        }));
    }

    else {

      staff = allStaff.map((u) => {

        const attendance =
          attendances.find(
            (a) => a.user.id === u.id,
          );

        let status: 'Present' | 'Late' | 'Absent' =
          'Absent';

        if (attendance?.checkInTime) {
          status = attendance.isLate
            ? 'Late'
            : 'Present';
        }

        return {
          id: u.id,
          attendanceId: attendance?.id ?? null,
          name: u.name,
          roles: u.roles,
          status,
        };
      });
    }

    return {
      total: allStaff.length,
      staff,
    };
  }

  // ============================
  // CHECK IN
  // ============================

  async checkIn(
    file: Express.Multer.File,
    lat: number,
    lng: number,
    user: User,
  ) {

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const existing = await this.attendanceRepo.findOne({
      where: {
        user: { id: user.id },
        tenant: { id: user.tenant.id },
        attendanceDate: today,
      },
      relations: ["location"],
    });

    if (existing) {
      throw new BadRequestException("Attendance already recorded today");
    }

    const location = user.location;

    if (!location)
      throw new ForbiddenException(
        'No assigned location',
      );

    const role = user.roles?.[0];

    let config: AttendanceConfig | null = null;

    if (role) {
      config = await this.configRepo.findOne({
        where: {
          role: { id: role.id },
          tenant: { id: user.tenant.id },
        },
      });
    }

    const allowOutsideRadius = config?.allowOutsideRadius ?? false;
    const lateThreshold = config?.lateThreshold ?? 10;

    const distance = this.calculateDistance(
      lat,
      lng,
      location.latitude,
      location.longitude,
    );

    const tolerance = 15; // meters GPS drift

    if (
      !allowOutsideRadius &&
      location.allowedRadius != null &&
      distance > location.allowedRadius + tolerance
    ) {
      throw new ForbiddenException(
        'Outside allowed radius',
      );
    }

    const now = new Date();
    let isLate = false;

    if (user.shiftStartTime) {

      const todayDate = now.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });

      const shiftStart = new Date(
        `${todayDate}T${user.shiftStartTime}:00`,
      );

      const graceMinutes = lateThreshold;

      const lateTime = new Date(
        shiftStart.getTime() +
        graceMinutes * 60000,
      );
      if (now > lateTime) {

        if (!config?.allowLateCheckIn) {
          throw new ForbiddenException(
            'Check-in not allowed after late threshold'
          );
        }

        isLate = true;
      }
    }

    const photoUrl = await uploadToR2(
      file.buffer,
      'attendance/checkin',
      file.mimetype,
    );

    // const today = now.toLocaleDateString('en-CA', {
    //   timeZone: 'Asia/Kolkata',
    // });

    const attendance = this.attendanceRepo.create({
      user,
      tenant: user.tenant,
      location,
      attendanceDate: today,
      checkInTime: now,
      checkInLat: lat,
      checkInLng: lng,
      checkInPhoto: photoUrl,
      isLate,
    });

    const saved = await this.attendanceRepo.save(attendance);

    await this.emitLiveAttendanceCount(user.tenant.id);

    return saved;
  }

  // ============================
  // CHECK OUT
  // ============================

  async checkOut(
    file: Express.Multer.File,
    lat: number,
    lng: number,
    user: User,
  ) {

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const attendance = await this.attendanceRepo.findOne({
      where: {
        user: { id: user.id },
        tenant: { id: user.tenant.id },
        attendanceDate: today,
      },
    });

    if (!attendance?.checkInTime)
      throw new BadRequestException(
        'Check-in not found',
      );

    if (attendance.checkOutTime)
      throw new BadRequestException(
        'Already checked out',
      );

    const photoUrl = await uploadToR2(
      file.buffer,
      'attendance/checkout',
      file.mimetype,
    );

    attendance.checkOutTime = new Date();
    attendance.checkOutLat = lat;
    attendance.checkOutLng = lng;
    attendance.checkOutPhoto = photoUrl;

    const saved = await this.attendanceRepo.save(attendance);

    await this.emitLiveAttendanceCount(user.tenant.id);

    return saved;
  }

  // =====================================================
  // ADMIN ACTION HANDLER (for dropdown actions)
  // =====================================================

  async handleAction(
    id: string,
    action: string,
    user: User,
  ) {

    const attendance = await this.attendanceRepo.findOne({
      where: {
        id,
        tenant: { id: user.tenant.id },
      },
      relations: ['user'],
    });

    if (!attendance)
      throw new BadRequestException('Attendance not found');

    switch (action) {

      case 'delete': {
        await this.attendanceRepo.remove(attendance);
        await this.emitLiveAttendanceCount(user.tenant.id);
        return { message: 'Attendance deleted' };
      }

      case 'override_late': {
        attendance.isLate = false;
        const saved = await this.attendanceRepo.save(attendance);
        await this.emitLiveAttendanceCount(user.tenant.id);
        return saved;
      }

      case 'override_halfday': {
        attendance.isHalfDay = !attendance.isHalfDay;
        const saved = await this.attendanceRepo.save(attendance);
        await this.emitLiveAttendanceCount(user.tenant.id);
        return saved;
      }

      case 'mark_present': {

        attendance.isAbsent = false;
        attendance.isLate = false;
        attendance.isHalfDay = false;

        if (!attendance.checkInTime) {
          attendance.checkInTime = new Date();
        }

        const saved = await this.attendanceRepo.save(attendance);

        await this.emitLiveAttendanceCount(user.tenant.id);

        return saved;
      }
      case 'mark_absent': {
        attendance.isAbsent = true;
        const saved = await this.attendanceRepo.save(attendance);
        await this.emitLiveAttendanceCount(user.tenant.id);
        return saved;
      }

      default:
        throw new BadRequestException('Invalid action');
    }
  }

  // =====================================================
  // MANUAL MARK ATTENDANCE
  // =====================================================

  async manualMark(body: any, admin: User) {

    const staff = await this.userRepo.findOne({
      where: { id: body.userId },
      relations: ['tenant', 'location'],
    });

    if (!staff)
      throw new BadRequestException('Staff not found');

    let attendance = await this.attendanceRepo.findOne({
      where: {
        tenant: { id: admin.tenant.id },
        user: { id: staff.id },
        attendanceDate: body.date,
      },
    });

    if (!attendance) {
      attendance = this.attendanceRepo.create({
        user: { id: staff.id },
        tenant: { id: admin.tenant.id },
        location: staff.location
          ? { id: staff.location.id }
          : undefined,
        attendanceDate: body.date,
      });
    }

    attendance.checkInTime = body.checkInTime
      ? new Date(`${body.date}T${body.checkInTime}`)
      : null;

    attendance.checkOutTime = body.checkOutTime
      ? new Date(`${body.date}T${body.checkOutTime}`)
      : null;

    const saved = await this.attendanceRepo.save(attendance);

    await this.emitLiveAttendanceCount(admin.tenant.id);

    return saved;
  }

  // =====================================================
  // MARK ABSENT
  // =====================================================

  async markAbsent(body: any, admin: User) {

    const staff = await this.userRepo.findOne({
      where: { id: body.userId },
      relations: ['tenant', 'location'],
    });

    if (!staff)
      throw new BadRequestException('Staff not found');

    const attendance = this.attendanceRepo.create({
      user: { id: staff.id },
      tenant: { id: admin.tenant.id },
      location: staff.location ? { id: staff.location.id } : undefined,
      attendanceDate: body.date,
      isAbsent: true,
    });

    const saved = await this.attendanceRepo.save(attendance);

    await this.emitLiveAttendanceCount(admin.tenant.id);

    return saved;
  }
  private async emitLiveAttendanceCount(tenantId: string) {

    const { start, end } = this.getISTDayBounds();

    const count = await this.attendanceRepo.count({
      where: {
        tenant: { id: tenantId },
        createdAt: Between(start, end),
        checkInTime: Not(IsNull()),
        checkOutTime: IsNull(),
      },
    });

    this.realtimeGateway.server.emit("attendance_live_update", {
      count,
    });
  }

  // ============================
  // DISTANCE CALCULATION
  // ============================

  private calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2,
  ) {

    const R = 6371e3;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;

    const Δφ =
      ((lat2 - lat1) * Math.PI) / 180;

    const Δλ =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) *
      Math.sin(Δφ / 2) +
      Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

    return (
      R *
      2 *
      Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    );
  }
  async getAttendanceById(id: string, user: User) {

    const attendance = await this.attendanceRepo.findOne({
      where: {
        id,
        tenant: { id: user.tenant.id },
      },
      relations: ['user', 'location'],
    });

    if (!attendance) {
      throw new BadRequestException('Attendance not found');
    }

    return attendance;
  }

  async getUserAttendanceAnalytics(userId: string, admin: User) {

    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const records = await this.attendanceRepo.find({
      where: {
        user: { id: userId },
        tenant: { id: admin.tenant.id },
        attendanceDate: Between(
          startOfMonth.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
          endOfMonth.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
        ),
      },
      relations: ['user'],  // ← added to access shiftEndTime
    });

    let daysWorked = 0;
    let lateDays = 0;
    let absents = 0;
    let overtime = 0;

    const calendar: {
      date: string;
      status: string;
      checkInTime: Date | null;
      checkOutTime: Date | null;
      checkInPhoto: string;
      checkOutPhoto: string;
      lat: number | null;
      lng: number | null;
    }[] = [];

    for (const r of records) {

      let status = "Absent";

      if (r.isAbsent) {
        status = "Absent";
        absents++;
      }

      else if (r.checkInTime) {

        status = r.isLate ? "Late" : "Present";
        daysWorked++;

        if (r.isLate) lateDays++;

        // ← overtime: day counts only if checkout is after shift end
        if (r.checkOutTime && r.user?.shiftEndTime) {
          const shiftEnd = new Date(
            `${r.attendanceDate}T${r.user.shiftEndTime}:00`
          );
          if (r.checkOutTime.getTime() > shiftEnd.getTime()) {
            overtime++;
          }
        }
      }

      calendar.push({
        date: r.attendanceDate,
        status,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        checkInPhoto: r.checkInPhoto,
        checkOutPhoto: r.checkOutPhoto,
        lat: r.checkInLat,
        lng: r.checkInLng,
      });
    }

    const todayDate = now.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });

    const today = records.find(
      (r) => r.attendanceDate === todayDate,
    );

    const status =
      today?.isAbsent
        ? "Absent"
        : today?.checkOutTime
          ? "Completed"
          : today?.checkInTime
            ? (today.isLate ? "Late" : "Present")
            : "Absent";

    return {
      summary: {
        daysWorked,
        lateDays,
        overtime,
        absents,
        status,
      },
      calendar,
    };
  }
  async getMyHistory(month: string, user: User) {
    // month = "2026-03"
    const [year, mon] = month.split('-').map(Number);

    const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
    const lastDay = new Date(year, mon, 0).getDate();          // last day of month
    const endDate = `${year}-${String(mon).padStart(2, '0')}-${lastDay}`;

    const records = await this.attendanceRepo.find({
      where: {
        user: { id: user.id },
        tenant: { id: user.tenant.id },
        attendanceDate: Between(startDate, endDate),
      },
      order: { attendanceDate: 'ASC' },
    });

    return records.map((r) => ({
      attendanceDate: r.attendanceDate,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      checkInPhoto: r.checkInPhoto ?? null,
      checkOutPhoto: r.checkOutPhoto ?? null,
      checkInLat: r.checkInLat ?? null,
      checkInLng: r.checkInLng ?? null,
      checkOutLat: r.checkOutLat ?? null,
      checkOutLng: r.checkOutLng ?? null,
      isLate: r.isLate,
      isHalfDay: r.isHalfDay,
      isAbsent: r.isAbsent,
    }));
  }
}