import { Module } from '@nestjs/common';
import { CryptoModule } from '../crypto/crypto.module';
import { OtpService } from './otp.service';

@Module({
  imports: [CryptoModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
