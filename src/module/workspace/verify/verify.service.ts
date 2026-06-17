import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { RedisService } from '../../../common/redis/redis.service';
import { BillingService } from '../../billing/billing.service';
import { RateLimitingService } from '../../rate-limiting/rate-limiting.service';
import { ApiKeyCache, ParsedApikey, VerifyApiKey } from './verify.type';

@Injectable()
export class VerifyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitingService,
    private readonly billingService: BillingService,
  ) {}

  private parseAuthHeaders(authorization: string): ParsedApikey {
    if (!authorization) throw new BadRequestException('Apikey is missing');

    const raw = authorization.split(' ')[1];
    if (!raw) throw new UnauthorizedException('Invalid authorization format');

    const apikeyRegex = /^([a-z][a-z0-9]+)_(live|test)_([a-f0-9]{32,70})$/;

    const match = raw.match(apikeyRegex);

    if (!match) throw new BadRequestException('Invalid api key');

    const [, prefixName, env, secret] = match;
    const prefix = secret.slice(0, 6);

    return {
      raw,
      prefixName,
      env,
      lookupKey: `${prefixName}_${env}_${prefix}`,
    };
  }
  private async record(lookupKey: string): Promise<ApiKeyCache> {
    const cached = await this.redisService.get(lookupKey);

    if (cached) return JSON.parse(cached) as ApiKeyCache;

    const dbRecord = await this.prisma.apiKey.findUnique({
      where: {
        keyPrefix: lookupKey,
      },
      select: {
        id: true,
        hashedKey: true,
        permission: true,
        status: true,
        lastUsedAt: true,
        expiresAt: true,
        policies: {
          select: {
            limit: true,
            window: true,
            burstLimit: true,
          },
        },
        api: {
          select: {
            workspace: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!dbRecord) throw new UnauthorizedException('Api key does not exist');

    if (!dbRecord.policies) {
      throw new InternalServerErrorException('Policy missing for API key');
    }

    const record: ApiKeyCache = {
      id: dbRecord.id,
      hashedKey: dbRecord.hashedKey,
      permission: dbRecord.permission,
      lastUsedAt: dbRecord.lastUsedAt,
      expiresAt: dbRecord.expiresAt,
      status: dbRecord.status,
      policy: dbRecord.policies,
      userId: dbRecord.api.workspace.userId,
    };

    await this.redisService.set(lookupKey, JSON.stringify(record), 60);

    return record;
  }

  private async validateRecord(
    record: ApiKeyCache,
    rawKey: string,
  ): Promise<void> {
    if (record.status !== 'active')
      throw new UnauthorizedException('Unauthorized');

    if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
      throw new UnauthorizedException('Api key has expired');
    }

    const isKeyMatch = await this.cryptoService.compareHash(
      rawKey,
      record.hashedKey,
    );
    if (!isKeyMatch) throw new UnauthorizedException('Invalid api key');
  }

  private touchLastUsed(lookupKey: string): void {
    void this.prisma.apiKey.update({
      where: { keyPrefix: lookupKey },
      data: { lastUsedAt: new Date() },
    });
  }

  async verify(
    authorization: string,
    namespace?: string,
    identifier?: string,
  ): Promise<VerifyApiKey> {
    try {
      const { raw, lookupKey } = this.parseAuthHeaders(authorization);

      const record = await this.record(lookupKey);

      await this.validateRecord(record, raw);

      await this.billingService.checkandIncrementQuota(record.userId);

      const rl = await this.rateLimitService.checkLimit(
        {
          lookupKey,
          namespace,
          identifier,
        },
        {
          limit: record.policy.limit!,
          window: record.policy.window!,
        },
      );

      if (!rl.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            limit: rl.limit,
            remaining: rl.remaining,
            resetAt: rl.resetAt,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.touchLastUsed(lookupKey);

      return {
        allowed: rl.allowed,
        keyId: record.id,
        permission: record.permission,
        remaining: rl.remaining,
        limit: rl.limit,
        resetAt: rl.resetAt,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      console.log(err);
      throw new InternalServerErrorException('Failed to verify');
    }
  }
}
