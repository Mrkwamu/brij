import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PolicyService } from './policy.service';
import { PolicyController } from './policy.controller';

@Module({
  imports: [PrismaModule],
  providers: [PolicyService],
  controllers: [PolicyController],
})
export class PolicyModule {}
