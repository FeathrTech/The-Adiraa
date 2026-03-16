import { Controller, Get, Post, Param, Body } from '@nestjs/common';

import { AttendanceConfigService } from './attendance-config.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { User } from '../users/user.entity';

@Controller('attendance/config')
export class AttendanceConfigController {

  constructor(private service: AttendanceConfigService) { }

  /*
  ============================
  GET MY CONFIG (staff)
  Must be above :roleId so NestJS does not match "me" as a param
  ============================
  */

  @Get('me')
  @RequirePermission('attendance.checkin')
  getMyConfig(@CurrentUser() user: User) {
    return this.service.getMyConfig(user);
  }

  /*
  ============================
  GET ROLE CONFIG (admin)
  ============================
  */

  @Get(':roleId')
  @RequirePermission('settings.attendance.view')
  getConfig(
    @Param('roleId') roleId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.getConfig(roleId, user);
  }

  /*
  ============================
  SAVE CONFIG (admin)
  ============================
  */

  @Post()
  @RequirePermission('settings.attendance.edit')
  saveConfig(
    @Body() body: any,
    @CurrentUser() user: User,
  ) {
    return this.service.saveConfig(
      {
        roleId: body.roleId,
        allowOutsideRadius: body.allowOutsideRadius,
        lateThreshold: body.lateThreshold,
        allowLateCheckIn: body.allowLateCheckIn,
        checkoutReminder1: body.checkoutReminder1 ?? null,
        checkoutReminder2: body.checkoutReminder2 ?? null,
      },
      user,
    );
  }
}