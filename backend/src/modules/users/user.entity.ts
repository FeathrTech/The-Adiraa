import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';

import { Role } from '../roles/role.entity';
import { Session } from '../sessions/session.entity';
import { Tenant } from '../tenant/tenant.entity';
import { Location } from '../location/location.entity';

@Entity('users')

// 🔥 USERNAME GLOBALLY UNIQUE
@Index(['username'], { unique: true })

// Optional: keep mobile unique per tenant
@Index(['tenant', 'mobile'], { unique: true })

export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // 🔥 LOGIN FIELD (john@banquetpro)
  @Column({ length: 150 })
  username: string;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  profilePhotoUrl?: string;

  @Column({ nullable: true })
  idProofUrl?: string;

  @Column({ nullable: true })
  shiftStartTime?: string;

  @Column({ nullable: true })
  shiftEndTime?: string;

  @Column({ nullable: true, type: 'varchar' })
  pushToken: string | null;

  /*
  ============================================
  RELATIONS
  ============================================
  */

  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
  })
  tenant: Tenant;

  @ManyToOne(() => Location, (location) => location.users, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  location: Location | null;

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @DeleteDateColumn()
  deletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}