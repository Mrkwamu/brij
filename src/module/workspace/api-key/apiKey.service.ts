// import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { createApiKeyDto } from './apikey.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ApikeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async createApiKey(dto: createApiKeyDto) {
    // generate a random string that will be used as the secret key for the user
    const secret = crypto.randomBytes(32).toString('hex');

    const hashedKey = this.cryptoService.hashValue(secret);

    const prefix = dto.prefix?.trim();
    const finalPrefix = prefix && prefix.length > 0 ? prefix : 'brj';

    const lookup = secret.slice(0, 6);

    const keyPrefix = `${finalPrefix}_${lookup}`;
    const apiKey = `${finalPrefix}_${secret}`;

    await this.prisma.apiKey.create({
      data: {
        workspaceId: dto.workspaceId,
        hashedKey,
        keyPrefix,
      },
    });

    return {
      apiKey,
    };
  }
}
