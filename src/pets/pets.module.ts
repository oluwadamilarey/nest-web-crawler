import { Module, CacheModule } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PetsResolver } from './pets.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './pet.entity';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet]),
    CacheModule.register({
      store: redisStore,
      host: '127.0.0.1',
      port: 6379,
    }),
  ],
  providers: [PetsService, PetsResolver],
})
export class PetsModule {}
