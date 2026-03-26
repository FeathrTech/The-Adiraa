import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { Tenant } from '../tenant/tenant.entity';
import { User } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Event } from '../events/event.entity';
import { Hall } from '../hall/hall.entity'; // uncomment when hall module created

@Entity('locations')
@Index(['tenant', 'name'])
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  // 🔥 FULL PRECISION GEO
  @Column('double precision', { nullable: true })
  latitude: number;

  @Column('double precision', { nullable: true })
  longitude: number;

  // 🔥 Radius in meters
  @Column({ type: 'int', default: 100 })
  allowedRadius: number;

  // 🔐 Tenant Binding
  @ManyToOne(() => Tenant, (tenant) => tenant.locations, {
    onDelete: 'CASCADE',
  })
  tenant: Tenant;

  // @OneToMany(() => User, (user) => user.location)
  // users: User[];

  @OneToMany(() => Attendance, (attendance) => attendance.location)
  attendances: Attendance[];

  @OneToMany(() => Event, (event) => event.location)
  events: Event[];

  // Future ready
  @OneToMany(() => Hall, (hall) => hall.location)
  halls: Hall[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}