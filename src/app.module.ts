import { Module } from '@nestjs/common';
import { CryptoModule } from './common/crypto/crypto.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionFilter } from './filter/exception.filter';
import { AuthModule } from './module/auth/auth.module';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthGuard } from './module/auth/jwt-auth.guard';
import { WorkspaceModule } from './module/workspace/workspace.module';
import { ApikeyModule } from './module/workspace/api-key/apiKey.module';
import { RedisModule } from './common/redis/redis.module';
import { RateLimitingModule } from './module/rate-limiting/rate-limiting.module';

@Module({
  imports: [
    CryptoModule,
    AuthModule,
    AppConfigModule,
    PrismaModule,
    WorkspaceModule,
    ApikeyModule,
    RedisModule,
    RateLimitingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
