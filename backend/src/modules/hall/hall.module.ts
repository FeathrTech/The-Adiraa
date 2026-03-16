import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Hall } from './hall.entity';
import { Location } from '../location/location.entity';

import { HallService } from './hall.service';
import { HallController } from './hall.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hall, Location])],
  providers: [HallService],
  controllers: [HallController],
})
export class HallModule {}