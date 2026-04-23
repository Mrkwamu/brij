import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  async hash(value: string) {
    if (!value) throw new Error('Enter value to hashed');
    const hashed = await bcrypt.hash(value, 10);

    return hashed;
  }

  async compareHash(value: string, hashedValue: string) {
    const result = await bcrypt.compare(value, hashedValue);

    return result;
  }

  hashValue(value: string) {
    if (!value) throw new Error('Enter value to hash');
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}
