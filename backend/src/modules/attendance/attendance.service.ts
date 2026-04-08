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
  status: 'Present' | 'Late' | 'Absent' | 'NotMarked';
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
        attendanceDate: new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        }),
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
      const endTime = attendance.checkOutTime ?? now;
      workingMinutes =
        (endTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60);
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

    const tenantId = user.tenant.id;

    const attendances = await this.attendanceRepo.find({
      where: {
        tenant: { id: tenantId },
        attendanceDate: date,
      },
      relations: ['user', 'user.roles'],
    });

    const allStaff = await this.userRepo.find({
      where: { tenant: { id: tenantId } },
      relations: ['roles'],
    });

    // ── exclude staff created after the selected date ──
    const selectedDay = new Date(date);
    selectedDay.setHours(23, 59, 59, 999);
    const eligibleStaff = allStaff.filter(
      (u) => new Date(u.createdAt) <= selectedDay,
    );

    // ── today = NotMarked, past = Absent ──
    const todayIST = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });
    const isToday = date === todayIST;
    const noRecordStatus: 'NotMarked' | 'Absent' = isToday ? 'NotMarked' : 'Absent';

    let staff: StaffAttendanceDto[] = [];

    if (filter === 'present') {
      staff = attendances
        .filter((a) => a.checkInTime && !a.isAbsent)
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
      staff = attendances
        .filter((a) => a.isAbsent)
        .map((a) => ({
          id: a.user.id,
          attendanceId: a.id,
          name: a.user.name,
          roles: a.user.roles,
          status: 'Absent',
        }));
    }

    else if (filter === 'not_marked') {
      const staffWithRecord = attendances.map((a) => a.user.id);
      staff = eligibleStaff
        .filter((u) => !staffWithRecord.includes(u.id))
        .map((u) => ({
          id: u.id,
          attendanceId: null,
          name: u.name,
          roles: u.roles,
          status: 'NotMarked',
        }));
    }

    else {
      // 'all'
      staff = eligibleStaff.map((u) => {
        const attendance = attendances.find((a) => a.user.id === u.id);

        let status: 'Present' | 'Late' | 'Absent' | 'NotMarked' = noRecordStatus;

        if (attendance?.isAbsent) {
          status = 'Absent';
        } else if (attendance?.checkInTime) {
          status = attendance.isLate ? 'Late' : 'Present';
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

    console.log(`[getDashboard] filter=${filter} staff.length=${staff.length} eligibleStaff.length=${eligibleStaff.length}`);
    return {
      total: staff.length,
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

    // ── Load user with all assigned locations ──
    const userWithLocations = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['locations', 'roles', 'tenant'],
    });

    if (!userWithLocations)
      throw new ForbiddenException('User not found');

    const assignedLocations = userWithLocations.locations ?? [];

    if (assignedLocations.length === 0)
      throw new ForbiddenException('No assigned location');

    // ── Load role config ──
    const role = userWithLocations.roles?.[0];
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
    const tolerance = 15;

    // ── Find which assigned location the staff is within radius of ──
    const matchedLocation = assignedLocations.find((loc) => {
      if (loc.latitude == null || loc.longitude == null) return false;
      const distance = this.calculateDistance(lat, lng, loc.latitude, loc.longitude);
      return distance <= (loc.allowedRadius ?? 0) + tolerance;
    });

    if (!matchedLocation && !allowOutsideRadius)
      throw new ForbiddenException('Outside allowed radius for all assigned locations');

    // Use matched location, or fall back to first assigned if allowOutsideRadius
    const location = matchedLocation ?? assignedLocations[0];

    // ── Late check ──
    const now = new Date();
    let isLate = false;

    if (user.shiftStartTime) {
      const todayDate = now.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });
      const shiftStart = new Date(`${todayDate}T${user.shiftStartTime}:00`);
      const lateTime = new Date(shiftStart.getTime() + lateThreshold * 60000);

      if (now > lateTime) {
        if (!config?.allowLateCheckIn) {
          throw new ForbiddenException('Check-in not allowed after late threshold');
        }
        isLate = true;
      }
    }

    const photoUrl = await uploadToR2(
      file.buffer,
      'attendance/checkin',
      file.mimetype,
    );

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
      throw new BadRequestException('Check-in not found');

    if (attendance.checkOutTime)
      throw new BadRequestException('Already checked out');

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
  // ADMIN ACTION HANDLER
  // =====================================================

  async handleAction(id: string, action: string, user: User) {

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
      relations: ['tenant', 'locations'],
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
        location: staff.locations?.[0] ? { id: staff.locations[0].id } : undefined,
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
      relations: ['tenant', 'locations'],
    });

    if (!staff)
      throw new BadRequestException('Staff not found');

    const attendance = this.attendanceRepo.create({
      user: { id: staff.id },
      tenant: { id: admin.tenant.id },
      location: staff.locations?.[0] ? { id: staff.locations[0].id } : undefined,
      attendanceDate: body.date,
      isAbsent: true,
    });

    const saved = await this.attendanceRepo.save(attendance);
    await this.emitLiveAttendanceCount(admin.tenant.id);
    return saved;
  }

  // =====================================================
  // EMIT LIVE COUNT
  // =====================================================

  private async emitLiveAttendanceCount(tenantId: string) {

    const { start, end } = this.getISTDayBounds();

    const count = await this.attendanceRepo.count({
      where: {
        tenant: { id: tenantId },
        attendanceDate: new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Kolkata",
        }),
        checkInTime: Not(IsNull()),
        checkOutTime: IsNull(),
      },
    });

    this.realtimeGateway.server.emit("attendance_live_update", { count });
  }

  // ============================
  // DISTANCE CALCULATION
  // ============================

  private calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ============================
  // GET ATTENDANCE BY ID
  // ============================

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

  // ============================
  // USER ANALYTICS
  // ============================

  async getUserAttendanceAnalytics(userId: string, admin: User, month?: string) {

    const now = new Date();

    let year: number;
    let mon: number;

    if (month) {
      const [y, m] = month.split('-').map(Number);
      year = y;
      mon = m - 1;
    } else {
      year = now.getFullYear();
      mon = now.getMonth();
    }

    const startOfMonth = new Date(year, mon, 1);
    const endOfMonth = new Date(year, mon + 1, 0);

    const targetUser = await this.userRepo.findOne({ where: { id: userId } });

    const userCreatedAt = targetUser?.createdAt ? new Date(targetUser.createdAt) : startOfMonth;
    const userJoinDateStr = userCreatedAt.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    const records = await this.attendanceRepo.find({
      where: {
        user: { id: userId },
        tenant: { id: admin.tenant.id },
        attendanceDate: Between(
          startOfMonth.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
          endOfMonth.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
        ),
      },
      relations: ['user'],
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
      checkInPhoto: string | null;
      checkOutPhoto: string | null;
      lat: number | null;
      lng: number | null;
    }[] = [];

    const todayIST = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    let d = new Date(startOfMonth);
    while (d <= endOfMonth) {
      const dateStr = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

      if (dateStr > todayIST) {
        d.setDate(d.getDate() + 1);
        continue;
      }

      if (dateStr < userJoinDateStr) {
        d.setDate(d.getDate() + 1);
        continue;
      }

      const r = records.find(rec => rec.attendanceDate === dateStr);

      let status: string;

      if (r?.isAbsent) {
        status = "Absent";
        absents++;
      } else if (r?.checkInTime) {
        status = r.isLate ? "Late" : "Present";
        daysWorked++;
        if (r.isLate) lateDays++;
      } else {
        if (dateStr === todayIST) {
          status = "NotMarked";
        } else {
          status = "Absent";
          absents++;
        }
      }

      calendar.push({
        date: dateStr,
        status,
        checkInTime: r?.checkInTime ?? null,
        checkOutTime: r?.checkOutTime ?? null,
        checkInPhoto: r?.checkInPhoto ?? null,
        checkOutPhoto: r?.checkOutPhoto ?? null,
        lat: r?.checkInLat ?? null,
        lng: r?.checkInLng ?? null,
      });

      d.setDate(d.getDate() + 1);
    }

    const todayRecord = records.find((r) => r.attendanceDate === todayIST);

    const status =
      todayRecord?.isAbsent
        ? "Absent"
        : todayRecord?.checkOutTime
          ? "Completed"
          : todayRecord?.checkInTime
            ? (todayRecord.isLate ? "Late" : "Present")
            : "NotMarked";

    return {
      summary: { daysWorked, lateDays, overtime, absents, status },
      calendar,
    };
  }

  // ============================
  // MY HISTORY
  // ============================

  async getMyHistory(month: string, user: User) {
    const [year, mon] = month.split('-').map(Number);
    const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
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

  // ============================
  // REPORT SUMMARY
  // ============================

  async getReportSummary(
    filters: {
      startDate: string;
      endDate: string;
      role?: string;
      staffId?: string;
      lateOnly?: boolean;
    },
    admin: User,
  ) {
    const { startDate, endDate, role, staffId, lateOnly } = filters;

    const todayIST = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });

    // ── Build user query ───────────────────────────────────────────────────────
    const userQuery = this.userRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.tenant = :tenantId', { tenantId: admin.tenant.id });

    if (staffId) {
      userQuery.andWhere('user.id = :staffId', { staffId });
    }
    if (role) {
      userQuery.andWhere('role.id = :roleId', { roleId: role });
    }

    const users = await userQuery.getMany();

    // ── Get all attendance records in range ────────────────────────────────────
    const attendanceQuery = this.attendanceRepo.createQueryBuilder('att')
      .leftJoinAndSelect('att.user', 'user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('att.tenant = :tenantId', { tenantId: admin.tenant.id })
      .andWhere('att.attendanceDate >= :startDate', { startDate })
      .andWhere('att.attendanceDate <= :endDate', { endDate });

    if (staffId) {
      attendanceQuery.andWhere('user.id = :staffId', { staffId });
    }
    if (role) {
      attendanceQuery.andWhere('role.id = :roleId', { roleId: role });
    }

    const records = await attendanceQuery.getMany();

    // ── Build all dates in range (excluding future dates) ─────────────────────
    const allDates: string[] = [];
    const cursor = new Date(startDate + 'T00:00:00');
    const endDay = new Date(endDate + 'T00:00:00');

    while (cursor <= endDay) {
      const dateStr = cursor.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });
      // Only include up to today — future dates are not absent
      if (dateStr <= todayIST) {
        allDates.push(dateStr);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const totalDays = allDates.length;

    // ── Per-staff summary ──────────────────────────────────────────────────────
    let grandTotalPresent = 0;
    let grandTotalAbsent = 0;
    let grandTotalLate = 0;
    let grandTotalHalfDay = 0;

    const staffSummary = users.map((u) => {
      const userRecords = records.filter((r) => r.user.id === u.id);

      // Only count dates from when the user was created
      const userJoinDate = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString('en-CA', {
          timeZone: 'Asia/Kolkata',
        })
        : startDate;

      // Dates this user is eligible for (joined before or on that date)
      const eligibleDates = allDates.filter((d) => d >= userJoinDate);

      let presentDays = 0;
      let lateDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      let totalMinutes = 0;

      for (const dateStr of eligibleDates) {
        const record = userRecords.find((r) => r.attendanceDate === dateStr);

        if (!record) {
          // ── No record at all → Absent ──────────────────────────────────────
          // Skip today if no record (still NotMarked, not Absent)
          if (dateStr !== todayIST) {
            absentDays++;
          }
        } else if (record.isAbsent) {
          // ── Explicitly marked absent ────────────────────────────────────────
          absentDays++;
        } else if (record.checkInTime) {
          // ── Has check-in → Present or Late ─────────────────────────────────
          presentDays++;
          if (record.isLate) lateDays++;
          if (record.isHalfDay) halfDays++;

          if (record.checkInTime && record.checkOutTime) {
            totalMinutes +=
              (new Date(record.checkOutTime).getTime() -
                new Date(record.checkInTime).getTime()) /
              60000;
          }
        } else {
          // ── Record exists but no check-in and not absent ────────────────────
          // (e.g. a record with only checkout, edge case) → treat as absent
          if (dateStr !== todayIST) {
            absentDays++;
          }
        }
      }

      grandTotalPresent += presentDays;
      grandTotalAbsent += absentDays;
      grandTotalLate += lateDays;
      grandTotalHalfDay += halfDays;

      const eligibleCount = eligibleDates.length;

      return {
        id: u.id,
        name: u.name,
        roles: u.roles.map((r) => r.name),
        // ── ADD THESE TWO ──
        joinDate: userJoinDate,           // "YYYY-MM-DD" string
        eligibleDays: eligibleDates.length,
        // ── existing fields ──
        presentDays,
        lateDays,
        absentDays,
        halfDays,
        totalWorkingMinutes: Math.floor(totalMinutes),
        attendanceRate:
          eligibleDates.length > 0
            ? Math.round((presentDays / eligibleDates.length) * 100)
            : 0,
      };
    });

    // ── Apply lateOnly filter after computing ──────────────────────────────────
    const filteredStaff = lateOnly
      ? staffSummary.filter((s) => s.lateDays > 0)
      : staffSummary;

    return {
      meta: {
        startDate,
        endDate,
        totalDays,
        totalStaff: users.length,
      },
      totals: {
        present: grandTotalPresent,
        absent: grandTotalAbsent,
        late: grandTotalLate,
        halfDay: grandTotalHalfDay,
      },
      staff: filteredStaff,
    };
  }

  // ============================
  // STAFF LIST FOR REPORT FILTERS
  // ============================

  async getStaffListForReport(admin: User) {
    const users = await this.userRepo.find({
      where: { tenant: { id: admin.tenant.id } },
      relations: ['roles'],
      order: { name: 'ASC' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      roles: u.roles.map((r) => ({ id: r.id, name: r.name })),
    }));
  }
}