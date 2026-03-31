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
  Rules:
  - Multiple in_talks allowed for the same hall + slot + date
  - A new event (any status) is blocked if a BOOKED event already
    exists for that hall + slot + date
  - Two BOOKED events for the same hall + slot + date are never allowed
  ===============================
  */

  async create(data: Partial<Event>, tenantId: string) {
    if (!data.location || !(data.location as any).id) {
      throw new ConflictException('locationId is required');
    }

    if (!data.hallName) {
      throw new ConflictException('hallName is required');
    }

    const locationId = (data.location as any).id;

    // Block if a BOOKED event already exists for this hall + slot + date
    const bookedExists = await this.eventRepo.findOne({
      where: {
        tenant: { id: tenantId },
        location: { id: locationId },
        date: data.date,
        eventSlot: data.eventSlot,
        hallName: data.hallName,
        status: EventStatus.BOOKED,
      },
    });

    if (bookedExists) {
      throw new ConflictException(
        `${data.eventSlot} slot is already confirmed for ${data.hallName} on this date`,
      );
    }

    // ← DELETE the entire in_talks check block that was here

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
  Returns all events for a location on a date.
  Optional hallName filters to a specific hall.
  Multiple in_talks per hall+slot are all returned.
  ===============================
  */

  async findByDate(
    date: string,
    tenantId: string,
    locationId: string,
    hallName?: string,
  ) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const where: any = {
      tenant: { id: tenantId },
      location: { id: locationId },
      date: Between(start, end),
    };

    if (hallName) {
      where.hallName = hallName;
    }

    return this.eventRepo.find({
      where,
      relations: ['location'],
      order: {
        hallName: 'ASC',
        eventSlot: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  /*
  ===============================
  UPDATE EVENT
  ===============================
  Rules:
  - Cannot update to a hall+slot+date that already has a BOOKED event
    (unless that BOOKED event is the one being updated)
  - Can freely update in_talks events
  - Cannot change an in_talks to booked if a booked already exists
    for the same hall+slot+date
  ===============================
  */

  async update(id: string, data: Partial<Event>, tenantId: string) {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['tenant', 'location'],
    });

    if (!event) throw new NotFoundException('Event not found');

    if (event.tenant.id !== tenantId) {
      throw new ForbiddenException();
    }

    const targetHall = data.hallName ?? event.hallName;
    const targetSlot = data.eventSlot ?? event.eventSlot;
    const targetDate = data.date ?? event.date;
    const targetStatus = data.status ?? event.status;
    const locationId = event.location?.id;

    // If hall, slot, date, or status is changing — run conflict checks
    if (data.hallName || data.date || data.eventSlot || data.status) {

      // Block if a *different* BOOKED event exists for the target hall+slot+date
      const bookedConflict = await this.eventRepo.findOne({
        where: {
          tenant: { id: tenantId },
          location: { id: locationId },
          date: targetDate,
          eventSlot: targetSlot,
          hallName: targetHall,
          status: EventStatus.BOOKED,
        },
      });

      if (bookedConflict && bookedConflict.id !== id) {
        throw new ConflictException(
          `${targetSlot} slot is already confirmed for ${targetHall} on this date`,
        );
      }

      // If upgrading this event to BOOKED, block if any OTHER in_talks
      // already exists for the same hall+slot+date
      // (to avoid two bookeds — the booked check above catches most cases,
      //  but this guards the race where two in_talks try to become booked)
      if (targetStatus === EventStatus.BOOKED && event.status === EventStatus.IN_TALKS) {
        const otherBooked = await this.eventRepo.findOne({
          where: {
            tenant: { id: tenantId },
            location: { id: locationId },
            date: targetDate,
            eventSlot: targetSlot,
            hallName: targetHall,
            status: EventStatus.BOOKED,
          },
        });

        if (otherBooked && otherBooked.id !== id) {
          throw new ConflictException(
            `Cannot confirm — another booking already exists for ${targetHall} ${targetSlot} on this date`,
          );
        }
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
  Returns per-date, per-slot status for dot coloring.

  Dot priority per slot (across all halls or filtered hall):
    booked > in_talks > (nothing = available implied by frontend)

  When no hall filter:
    - If ANY hall has a booked slot → dot = booked
    - Else if ANY hall has in_talks → dot = in_talks
    - Else → no dot (frontend shows available)

  When hall filter active:
    - Same priority logic but only for that hall's events
  ===============================
  */

  async getCalendarSummary(
    tenantId: string,
    locationId: string,
    year: number,
    month: number,
    hallName?: string,
  ) {
    const qb = this.eventRepo
      .createQueryBuilder('event')
      .select(['event.date', 'event.eventSlot', 'event.status', 'event.hallName'])
      .where('event.tenantId = :tenantId', { tenantId })
      .andWhere('event.locationId = :locationId', { locationId })
      .andWhere(
        `TO_CHAR(event.date, 'YYYY-MM') = :yearMonth`,
        { yearMonth: `${year}-${String(month).padStart(2, '0')}` }
      );

    if (hallName) {
      qb.andWhere('event.hallName = :hallName', { hallName });
    }

    const events = await qb.getMany();
    console.log('=== CALENDAR SUMMARY DEBUG ===');
    console.log('hallName param received:', hallName);
    console.log('typeof hallName:', typeof hallName);
    console.log('events count:', events.length);
    events.forEach(e => console.log(' -', e.hallName, '|', e.eventSlot, '|', e.status));

    const calendar: Record<string, { lunch?: EventStatus; dinner?: EventStatus }> = {};

    events.forEach((event) => {
      const date = new Date(event.date).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
      });

      if (!calendar[date]) calendar[date] = {};
      const current = calendar[date][event.eventSlot];

      if (!current || current === EventStatus.IN_TALKS) {
        calendar[date][event.eventSlot] = event.status;
      }
    });

    return calendar;
  }
}