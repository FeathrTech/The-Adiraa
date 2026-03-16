import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Location } from '../location/location.entity';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { Hall } from '../hall/hall.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Display name (can change)
  @Column()
  name: string;

  // Unique slug used for login & identification
  @Index({ unique: true })
  @Column({ length: 100 })
  slug: string; // e.g. banquetpro, royalevents

  // One Tenant → Many Locations
  @OneToMany(() => Location, (location) => location.tenant)
  locations: Location[];

  // One Tenant → Many Users
  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  // One Tenant → Many Roles
  @OneToMany(() => Role, (role) => role.tenant)
  roles: Role[];

  @OneToMany(() => Hall, (hall) => hall.tenant)
  halls: Hall[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}