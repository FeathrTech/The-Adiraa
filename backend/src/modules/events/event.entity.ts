import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { Tenant } from '../tenant/tenant.entity';
import { Location } from '../location/location.entity';

/*
================================================
ENUMS
================================================
*/

export enum EventSlot {
  LUNCH = 'lunch',
  DINNER = 'dinner',
}

export enum EventStatus {
  BOOKED = 'booked',
  IN_TALKS = 'in_talks',
}

/*
================================================
EVENT ENTITY
================================================
*/

@Entity('events')

/* Fast filtering for tenant calendar */
@Index(['tenant', 'date'])

/*
  No longer unique — multiple in_talks allowed per hall+slot+date.
  Only a BOOKED event blocks further bookings (enforced in service).
  Index kept for query performance.
*/
@Index(['tenant', 'date', 'eventSlot', 'hallName'])

/* Status lookup */
@Index(['tenant', 'status'])

export class Event {

  /*
  ================================
  PRIMARY KEY
  ================================
  */

  @PrimaryGeneratedColumn('uuid')
  id: string;

  /*
  ================================
  TENANT
  ================================
  */

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  /*
  ================================
  VENUE / LOCATION
  ================================
  */

  @ManyToOne(() => Location, (location) => location.events, {
    onDelete: 'CASCADE',
  })
  location: Location;

  /*
  ================================
  HALL — required, drives per-hall uniqueness
  ================================
  */

  @Column()
  hallName: string;

  /*
  ================================
  EVENT DETAILS
  ================================
  */

  @Column()
  title: string;

  @Column()
  clientName: string;

  @Column({ nullable: true })
  clientContact: string;

  /*
  ================================
  EVENT DATE
  ================================
  */

  @Column({ type: 'date' })
  date: Date;

  /*
  ================================
  EVENT SLOT
  ================================
  */

  @Column({
    type: 'enum',
    enum: EventSlot,
  })
  eventSlot: EventSlot;

  /*
  ================================
  EVENT STATUS
  ================================
  */

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.BOOKED,
  })
  status: EventStatus;

  /*
  ================================
  NOTES
  ================================
  */

  @Column({ nullable: true, type: 'text' })
  notes: string;

  /*
  ================================
  TIMESTAMPS
  ================================
  */

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}