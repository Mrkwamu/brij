import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    //create an email queue in redis
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService, BullModule],
})
export class EmailModule {}
