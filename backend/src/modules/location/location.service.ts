import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Location } from './location.entity';
import { User } from '../users/user.entity';
import { TenantAwareService } from '../../common/base/tenant-aware.service';

@Injectable()
export class LocationService extends TenantAwareService<Location> {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {
    super(locationRepo);
  }

  async create(
    data: {
      name: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      allowedRadius?: number;
    },
    currentUser: User,
  ) {
    const tenantId = this.getTenantId(currentUser);

    const existing = await this.locationRepo.findOne({
      where: {
        name: data.name,
        tenant: { id: tenantId },
      },
    });

    if (existing) {
      throw new ForbiddenException('Location already exists');
    }

    const location = this.locationRepo.create({
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      allowedRadius: data.allowedRadius ?? 100,
      tenant: { id: tenantId }, // ✅ FIXED
    });

    return this.locationRepo.save(location);
  }

  async findAll(currentUser: User) {
    return this.locationRepo.find({
      where: {
        tenant: { id: this.getTenantId(currentUser) },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, currentUser: User) {
    const location = await this.locationRepo.findOne({
      where: {
        id,
        tenant: { id: this.getTenantId(currentUser) },
      },
      relations: [
        'halls',  
        // 'users',
      ],
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async update(
    id: string,
    data: {
      name?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      allowedRadius?: number;
    },
    currentUser: User,
  ) {
    const location = await this.findOne(id, currentUser);

    if (data.name !== undefined) location.name = data.name;
    if (data.address !== undefined) location.address = data.address;
    if (data.latitude !== undefined)
      location.latitude = data.latitude;
    if (data.longitude !== undefined)
      location.longitude = data.longitude;
    if (data.allowedRadius !== undefined)
      location.allowedRadius = data.allowedRadius;

    return this.locationRepo.save(location);
  }

  async delete(id: string, currentUser: User) {
    const location = await this.findOne(id, currentUser);

    await this.locationRepo.remove(location);

    return { message: 'Location deleted successfully' };
  }
}