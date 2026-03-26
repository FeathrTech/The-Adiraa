import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';

import { EventsService } from './event.service';
import { Request } from 'express';
import { Event } from './event.entity';

interface AuthRequest extends Request {
  user: {
    tenantId: string;
    id: string;
  };
}

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  /*
  ===============================
  CREATE EVENT
  ===============================
  */

  @Post()
  async create(@Body() body: Partial<Event>, @Req() req: AuthRequest) {
    const tenantId = req.user.tenantId;

    return this.eventsService.create(body, tenantId);
  }

  /*
  ===============================
  GET ALL EVENTS
  ===============================
  */

  @Get()
  async findAll(@Req() req: AuthRequest) {
    const tenantId = req.user.tenantId;

    return this.eventsService.findAll(tenantId);
  }

  /*
  ===============================
  GET EVENTS BY DATE
  ===============================
  Optional ?hallName=Ground+Floor filters to a specific hall.
  Without it, returns all halls' events for that date+location.
  ===============================
  */

  @Get('by-date')
  async findByDate(
    @Query('date') date: string,
    @Query('locationId') locationId: string,
    @Query('hallName') hallName: string,
    @Req() req: AuthRequest,
  ) {
    if (!date) {
      throw new BadRequestException('date query parameter required');
    }

    if (!locationId) {
      throw new BadRequestException('locationId query parameter required');
    }

    const tenantId = req.user.tenantId;

    return this.eventsService.findByDate(date, tenantId, locationId, hallName);
  }

  /*
  ===============================
  CALENDAR SUMMARY
  ===============================
  Optional ?hallName=Ground+Floor filters dots to a specific hall.
  Without it, dot reflects worst-case status across all halls.
  ===============================
  */

  @Get('calendar')
  async calendar(
    @Query('siteId') siteId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('hallName') hallName: string,
    @Req() req: AuthRequest,
  ) {
    if (!siteId) {
      throw new BadRequestException('siteId required');
    }

    if (!year || !month) {
      throw new BadRequestException('year and month required');
    }

    const tenantId = req.user.tenantId;

    return this.eventsService.getCalendarSummary(
      tenantId,
      siteId,
      Number(year),
      Number(month),
      hallName,
    );
  }

  /*
  ===============================
  GET SINGLE EVENT
  ===============================
  */

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user.tenantId;

    const events = await this.eventsService.findAll(tenantId);

    return events.find((e) => e.id === id);
  }

  /*
  ===============================
  UPDATE EVENT
  ===============================
  */

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: Partial<Event>,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user.tenantId;

    return this.eventsService.update(id, body, tenantId);
  }

  /*
  ===============================
  DELETE EVENT
  ===============================
  */

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthRequest,
  ) {
    const tenantId = req.user.tenantId;

    return this.eventsService.remove(id, tenantId);
  }
}