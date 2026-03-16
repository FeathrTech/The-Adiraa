import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { HallService } from './hall.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('sites/:locationId/halls')
export class HallController {
  constructor(private readonly hallService: HallService) {}

  @Post()
  @RequirePermission('site.edit')
  async create(
    @Param('locationId') locationId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      capacity?: number;
    },
    @CurrentUser() user: User,
  ) {
    return this.hallService.create(locationId, body, user);
  }

  @Get()
  @RequirePermission('site.view')
  async findAll(
    @Param('locationId') locationId: string,
    @CurrentUser() user: User,
  ) {
    return this.hallService.findByLocation(locationId, user);
  }

  @Patch(':id')
  @RequirePermission('site.edit')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      capacity?: number;
    },
    @CurrentUser() user: User,
  ) {
    return this.hallService.update(id, body, user);
  }

  @Delete(':id')
  @RequirePermission('site.edit')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.hallService.delete(id, user);
  }
}