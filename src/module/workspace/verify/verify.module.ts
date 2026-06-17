import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CryptoModule } from '../../../common/crypto/crypto.module';
import { RedisModule } from '../../../common/redis/redis.module';
import { RateLimitingModule } from '../../rate-limiting/rate-limiting.module';
import { BillingModule } from '../../billing/billing.module';

@Module({
  imports: [
    PrismaModule,
    CryptoModule,
    RedisModule,
    RateLimitingModule,
    BillingModule,
  ],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
