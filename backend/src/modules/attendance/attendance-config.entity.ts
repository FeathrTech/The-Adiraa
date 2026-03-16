import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Role } from '../roles/role.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity()
export class AttendanceConfig {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Role, { eager: true })
  role: Role;

  @ManyToOne(() => Tenant)
  tenant: Tenant;

  @Column({ default: false })
  allowOutsideRadius: boolean;

  @Column({ default: 0 })
  lateThreshold: number;

  @Column({ default: true })
  allowLateCheckIn: boolean;

  // e.g. "17:00" — first checkout reminder time (IST, 24h format)
  @Column({ nullable: true, type: 'varchar' })
  checkoutReminder1: string | null;

  // e.g. "18:30" — second checkout reminder time (IST, 24h format)
  @Column({ nullable: true, type: 'varchar' })
  checkoutReminder2: string | null;
}