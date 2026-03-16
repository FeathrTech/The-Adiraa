import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Hall } from './hall.entity';
import { Location } from '../location/location.entity';
import { User } from '../users/user.entity';

@Injectable()
export class HallService {
  constructor(
    @InjectRepository(Hall)
    private readonly hallRepo: Repository<Hall>,

    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) { }

  private getTenantId(user: User) {
    return user?.tenant?.id;
  }

  async create(
    locationId: string,
    data: { name: string; description?: string; capacity?: number },
    currentUser: User,
  ) {
    const tenantId = this.getTenantId(currentUser);

    const location = await this.locationRepo.findOne({
      where: {
        id: locationId,
        tenant: { id: tenantId },
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const existing = await this.hallRepo.findOne({
      where: {
        name: data.name,
        location: { id: locationId },
        tenant: { id: tenantId },
      },
    });

    if (existing) {
      throw new ForbiddenException('Hall already exists');
    }

    const hall = this.hallRepo.create({
      name: data.name,
      description: data.description,
      capacity: data.capacity,
      tenant: { id: tenantId }, // ✅ FIXED
      location,
    });

    return this.hallRepo.save(hall);
  }

  async findByLocation(locationId: string, currentUser: User) {
    return this.hallRepo.find({
      where: {
        location: { id: locationId },
        tenant: { id: this.getTenantId(currentUser) },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    data: { name?: string; description?: string; capacity?: number },
    currentUser: User,
  ) {
    const hall = await this.hallRepo.findOne({
      where: {
        id,
        tenant: { id: this.getTenantId(currentUser) },
      },
    });

    if (!hall) {
      throw new NotFoundException('Hall not found');
    }

    if (data.name !== undefined) hall.name = data.name;
    if (data.description !== undefined)
      hall.description = data.description;
    if (data.capacity !== undefined)
      hall.capacity = data.capacity;

    return this.hallRepo.save(hall);
  }

  async delete(id: string, currentUser: User) {
    const hall = await this.hallRepo.findOne({
      where: {
        id,
        tenant: { id: this.getTenantId(currentUser) },
      },
    });

    if (!hall) {
      throw new NotFoundException('Hall not found');
    }

    await this.hallRepo.remove(hall);

    return { message: 'Hall deleted successfully' };
  }
}