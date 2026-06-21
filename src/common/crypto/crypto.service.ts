import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly hmacSecret: string;

  constructor(private readonly configSecret: ConfigService) {
    const secret = this.configSecret.get<string>('HASH_SECRET_KEY');

    if (!secret) {
      throw new Error('HASH_SECRET_KEY is not defined');
    }

    this.hmacSecret = secret;
  }
  async hash(value: string) {
    if (!value) throw new Error('Enter value to hashed');
    const hashed = await bcrypt.hash(value, 10);

    return hashed;
  }
  async compareHash(value: string, hashedValue: string) {
    const result = await bcrypt.compare(value, hashedValue);

    return result;
  }

  sign(value: string) {
    if (!value) throw new Error('Enter value to hash');
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(value)
      .digest('hex');
  }

  verify(value: string, storedHash: string): boolean {
    const computed = Buffer.from(this.sign(value), 'hex');
    const expected = Buffer.from(storedHash, 'hex');

    if (computed.length !== expected.length) return false;

    return crypto.timingSafeEqual(computed, expected);
  }
}
