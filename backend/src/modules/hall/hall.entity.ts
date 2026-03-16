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

@Entity('halls')
@Index(['tenant', 'location', 'name'], { unique: true })
export class Hall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  // 🔐 Tenant Binding
  @ManyToOne(() => Tenant, (tenant) => tenant.halls, {
    onDelete: 'CASCADE',
  })
  tenant: Tenant;

  // 🔗 Location Binding
  @ManyToOne(() => Location, (location) => location.halls, {
    onDelete: 'CASCADE',
  })
  location: Location;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}