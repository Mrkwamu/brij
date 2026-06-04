import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { QuotaSyncService } from './quota-sync.service';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, RedisModule],
  providers: [BillingService, QuotaSyncService],
  controllers: [BillingController],
  exports: [BillingService],
})
export class BillingModule {}
