import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CryptoModule } from '../../common/crypto/crypto.module';
import { RateLimitingService } from '../rate-limiting/rate-limiting.service';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, RateLimitingService, RedisService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
