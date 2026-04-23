import { Module } from '@nestjs/common';
import { ApikeyController } from './apiKey.controller';
import { ApikeyService } from './apiKey.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CrytoModule } from '../../../common/crypto/crypto.module';

@Module({
  imports: [PrismaModule, CrytoModule],
  controllers: [ApikeyController],
  providers: [ApikeyService],
})
export class ApikeyModule {}
