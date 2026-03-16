import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { Event, EventSlot, EventStatus } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) { }

  /*
  ===============================
  CREATE EVENT
  ===============================
  */

  async create(data: Partial<Event>, tenantId: string) {

    if (!data.location || !(data.location as any).id) {
      throw new ConflictException('locationId is required');
    }

    const locationId = (data.location as any).id;

    const exists = await this.eventRepo.findOne({
      where: {
        tenant: { id: tenantId },
        location: { id: locationId },
        date: data.date,
        eventSlot: data.eventSlot,
      },
    });

    if (exists) {
      throw new ConflictException(
        `${data.eventSlot} slot already booked for this date`,
      );
    }

    const event = this.eventRepo.create({
      ...data,
      tenant: { id: tenantId },
      location: { id: locationId },
    });

    return this.eventRepo.save(event);
  }

  /*
  ===============================
  GET ALL EVENTS
  ===============================
  */

  async findAll(tenantId: string) {
    return this.eventRepo.find({
      where: {
        tenant: { id: tenantId },
      },
      relations: ['location'],
      order: {
        date: 'ASC',
      },
    });
  }

  /*
  ===============================
  GET EVENTS BY DATE
  ===============================
  */

  async findByDate(date: string, tenantId: string, locationId: string) {

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.eventRepo.find({
      where: {
        tenant: { id: tenantId },
        location: { id: locationId },
        date: Between(start, end),
      },
      relations: ['location'],
    });
  }

  /*
  ===============================
  UPDATE EVENT
  ===============================
  */

  async update(id: string, data: Partial<Event>, tenantId: string) {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!event) throw new NotFoundException('Event not found');

    if (event.tenant.id !== tenantId) {
      throw new ForbiddenException();
    }

    /*
    Prevent slot conflict if slot/date changed
    */

    if (data.date || data.eventSlot) {
      const conflict = await this.eventRepo.findOne({
        where: {
          tenant: { id: tenantId },
          date: data.date ?? event.date,
          eventSlot: data.eventSlot ?? event.eventSlot,
        },
      });

      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          'This slot is already booked for the selected date',
        );
      }
    }

    Object.assign(event, data);

    return this.eventRepo.save(event);
  }

  /*
  ===============================
  DELETE EVENT
  ===============================
  */

  async remove(id: string, tenantId: string) {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!event) throw new NotFoundException('Event not found');

    if (event.tenant.id !== tenantId) {
      throw new ForbiddenException();
    }

    await this.eventRepo.remove(event);

    return { message: 'Event deleted' };
  }

  /*
  ===============================
  CALENDAR SUMMARY
  ===============================
  Returns color per date
  ===============================
  */

  async getCalendarSummary(
    tenantId: string,
    locationId: string,
    year: number,
    month: number,
  ) {

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const events = await this.eventRepo.find({
      where: {
        tenant: { id: tenantId },
        location: { id: locationId },
        date: Between(start, end),
      },
      select: ["date", "eventSlot", "status"],
    });

    const calendar: Record<
      string,
      { lunch?: EventStatus; dinner?: EventStatus }
    > = {};

    events.forEach((event) => {

      const date = new Date(event.date).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

      if (!calendar[date]) {
        calendar[date] = {};
      }

      calendar[date][event.eventSlot] = event.status;

    });

    return calendar;
  }
}