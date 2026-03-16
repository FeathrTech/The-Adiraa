import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Tenant } from '../tenant/tenant.entity';
import { Location } from '../location/location.entity';

@Entity('attendance')
@Index(['tenant', 'location'])
@Index(['tenant', 'user'])
@Index(['createdAt'])
@Index(['tenant', 'user', 'attendanceDate'], { unique: true })
export class Attendance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    tenant: Tenant;


    @ManyToOne(() => Location, (location) => location.attendances, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    location?: Location;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @Column({ type: 'timestamp', nullable: true })
    checkInTime: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    checkOutTime: Date | null;

    @Column({ nullable: true })
    checkInPhoto: string;

    @Column({ nullable: true })
    checkOutPhoto: string;

    @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
    checkInLat: number;

    @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
    checkInLng: number;

    @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
    checkOutLat: number;

    @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
    checkOutLng: number;

    @Column({ default: false })
    isLate: boolean;

    @Column({ default: false })
    isHalfDay: boolean;

    @Column({ default: false })
    isAbsent: boolean;

    @Column({ type: 'date' })
    attendanceDate: string; // YYYY-MM-DD

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}
