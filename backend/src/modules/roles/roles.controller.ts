import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
} from '@nestjs/common';

import { RolesService } from './roles.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Post()
  @RequirePermission('role.create')
  async create(
    @Body() body: { name: string },
    @CurrentUser() user: User,
  ) {
    return this.rolesService.create(body.name, user);
  }

  @Get()
  @RequirePermission('role.view')
  async findAll(@CurrentUser() user: User) {
    return this.rolesService.findAll(user);
  }

  @Post(':id/permissions')
  @RequirePermission('role.assign_permissions')
  async assignPermissions(
    @Param('id') roleId: string,
    @Body() body: { permissionIds: string[] },
    @CurrentUser() user: User,
  ) {
    return this.rolesService.assignPermissions(
      roleId,
      body.permissionIds,
      user,
    );
  }

  @Post('assign-to-user')
  @RequirePermission('role.assign_to_user')
  async assignRoleToUser(
    @Body() body: { userId: string; roleId: string },
    @CurrentUser() user: User,
  ) {
    return this.rolesService.assignRoleToUser(
      body.userId,
      body.roleId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermission('role.delete')
  async delete(
    @Param('id') roleId: string,
    @CurrentUser() user: User,
  ) {
    return this.rolesService.delete(roleId, user);
  }

  @Get(':id')
  @RequirePermission('role.view')
  async findOne(
    @Param('id') roleId: string,
    @CurrentUser() user: User,
  ) {
    return this.rolesService.findOne(roleId, user);
  }

}
