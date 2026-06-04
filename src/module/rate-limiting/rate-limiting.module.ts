import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { RateLimitingService } from './rate-limiting.service';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [RateLimitingService],
  exports: [RateLimitingService],
})
export class RateLimitingModule {}
