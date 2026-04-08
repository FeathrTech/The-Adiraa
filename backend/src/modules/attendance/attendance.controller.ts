import {
  Controller,
  Post,
  Get,
  Patch,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
  Param,
  Req,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { AttendanceService } from './attendance.service';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

import { User } from '../users/user.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
  ) { }

  /* ================= STAFF: TODAY STATUS ================= */

  @Get('today')
  @RequirePermission('attendance.checkin', 'attendance.checkout', 'attendance.view.own')
  getToday(@CurrentUser() user: User) {
    return this.service.getTodayStatus(user);
  }

  /* ================= STAFF CHECKIN ================= */

  @Post('checkin')
  @RequirePermission('attendance.checkin')
  @UseInterceptors(FileInterceptor('photo'))
  checkIn(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser() user: User,
  ) {
    console.log("FILE:", file);
    console.log("BODY:", body);

    return this.service.checkIn(
      file,
      Number(body.lat),
      Number(body.lng),
      user,
    );
  }

  @Get('my-history')
  @RequirePermission('attendance.view.own')
  getMyHistory(
    @Query('month') month: string,
    @CurrentUser() user: User,
  ) {
    return this.service.getMyHistory(month, user);
  }

  /* ================= STAFF CHECKOUT ================= */

  @Post('checkout')
  @RequirePermission('attendance.checkout')
  @UseInterceptors(FileInterceptor('photo'))
  checkOut(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @CurrentUser() user: User,
  ) {
    return this.service.checkOut(
      file,
      Number(body.lat),
      Number(body.lng),
      user,
    );
  }

  /* ================= ADMIN DASHBOARD ================= */

  @Get('dashboard')
  @RequirePermission('attendance.view.dashboard_summary')
  getDashboard(
    @Query('date') date: string,
    @Query('filter') filter: string,
    @CurrentUser() user: User,
  ) {
    return this.service.getDashboard(date, filter, user);
  }

  @Get(':id')
  getAttendanceById(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.service.getAttendanceById(id, user);
  }

  /* ======================================================
     ADMIN ACTIONS (Dropdown actions from mobile UI)
     ====================================================== */

  @Patch(':id/action')
  handleAction(
    @Param('id') id: string,
    @Body() body: { action: string },
    @CurrentUser() user: User,
  ) {
    return this.service.handleAction(id, body.action, user);
  }

  /* ================= MANUAL ATTENDANCE ================= */

  @Post('manual-mark')
  @RequirePermission('attendance.manual_mark')
  manualMark(
    @Body() body: {
      userId: string;
      date: string;
      checkInTime?: string;
      checkOutTime?: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.service.manualMark(body, user);
  }

  /* ================= MARK ABSENT ================= */

  @Post('mark-absent')
  @RequirePermission('attendance.mark_absent')
  markAbsent(
    @Body() body: {
      userId: string;
      date: string;
    },
    @CurrentUser() user: User,
  ) {
    return this.service.markAbsent(body, user);
  }

  /* ================= STAFF ANALYTICS ================= */

  // ✅ Added ?month=YYYY-MM query param — defaults to current month if omitted
  @Get("analytics/:userId")
  getUserAttendanceAnalytics(
    @Param("userId") userId: string,
    @Query("month") month: string,
    @Req() req,
  ) {
    return this.service.getUserAttendanceAnalytics(userId, req.user, month);
  }

  /* ================= REPORTS ================= */

  @Get('report/summary')
  @RequirePermission('attendance.view.dashboard_summary')
  getReportSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('role') role: string,
    @Query('staffId') staffId: string,
    @Query('lateOnly') lateOnly: string,
    @CurrentUser() user: User,
  ) {
    return this.service.getReportSummary(
      { startDate, endDate, role, staffId, lateOnly: lateOnly === 'true' },
      user,
    );
  }

  @Get('report/staff-list')
  @RequirePermission('attendance.view.dashboard_summary')
  getStaffList(@CurrentUser() user: User) {
    return this.service.getStaffListForReport(user);
  }

}