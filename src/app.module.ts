import { Module } from '@nestjs/common';
import { CrytoModule } from './common/crypto/crypto.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionFilter } from './filter/exception.filter';
import { AuthModule } from './module/auth/auth.module';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthGuard } from './module/auth/jwt-auth.guard';
import { WorkspaceModule } from './module/workspace/workspace.module';
import { ApikeyModule } from './module/workspace/api-key/apiKey.module';

@Module({
  imports: [
    CrytoModule,
    AuthModule,
    AppConfigModule,
    PrismaModule,
    WorkspaceModule,
    ApikeyModule,
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
