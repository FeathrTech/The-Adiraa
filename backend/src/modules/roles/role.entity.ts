import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Permission } from '../permissions/permission.entity';
import { User } from '../users/user.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('roles')
@Index(['tenant', 'name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  name: string;

  // 🔥 Tenant scoped role
  @ManyToOne(() => Tenant, (tenant) => tenant.roles, {
    onDelete: 'CASCADE',
  })
  tenant: Tenant;

  // 🔐 Permissions (Global)
  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'role_permissions',
  })
  permissions: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
