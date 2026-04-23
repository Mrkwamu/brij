import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { CrytoModule } from '../../common/crypto/crypto.module';

@Module({
  imports: [PrismaModule, CrytoModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
