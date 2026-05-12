import { randomInt } from 'crypto';
import { CryptoService } from '../crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import { parseDurationToMs } from '../parse/parse-durarion-to-ms';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GenerateOtpResult } from './type';

@Injectable()
export class OtpService {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
  ) {}

  // generate 6 digit otp code and hash it
  async generateOtp(): Promise<GenerateOtpResult> {
    const otp = randomInt(100000, 1000000);

    const hashedOtp = await this.cryptoService.hash(String(otp));

    const otpExpiry = this.configService.get<string>('OTP_EXPIRY');

    if (!otpExpiry) {
      throw new InternalServerErrorException('OTP configuration missing');
    }

    const ttlMs = parseDurationToMs(otpExpiry);
    const expiresAt = new Date(Date.now() + ttlMs);

    return { otp, hashedOtp, expiresAt };
  }
}
