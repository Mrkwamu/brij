import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { RateLimitingService } from './rate-limiting.service';
import { RateLimitingController } from './rate-limiting.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [RateLimitingController],
  providers: [RateLimitingService],
})
export class RateLimitingModule {}
