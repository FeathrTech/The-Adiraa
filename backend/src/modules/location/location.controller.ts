import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { LocationService } from './location.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('sites')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @RequirePermission('site.create')
  async create(
    @Body()
    body: {
      name: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      allowedRadius?: number;
    },
    @CurrentUser() user: User,
  ) {
    return this.locationService.create(body, user);
  }

  @Get()
  @RequirePermission('site.view')
  async findAll(@CurrentUser() user: User) {
    return this.locationService.findAll(user);
  }

  @Get(':id')
  @RequirePermission('site.view')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.locationService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermission('site.edit')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      allowedRadius?: number;
    },
    @CurrentUser() user: User,
  ) {
    return this.locationService.update(id, body, user);
  }

  @Delete(':id')
  @RequirePermission('site.delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.locationService.delete(id, user);
  }
}