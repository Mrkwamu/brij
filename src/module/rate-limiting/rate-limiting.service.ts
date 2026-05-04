import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { TOKEN_BUCKET_SCRIPT } from './rate-limiting.script';
// import { UsageLogsService } from './usage-log.service';
// import { UsageLogsStatus } from '../../../generated/prisma/enums';

//rate limit type
// type RateLimitResult =
//   | {
//       allowed: true;
//       remaining: number;
//     }
//   | {
//       allowed: false;
//       reason: string;
//     };

@Injectable()
export class RateLimitingService {
  private policyCache = new Map<
    string,
    {
      limit: number;
      window: number;
      expiresAt: number;
    }
  >();
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async getPolicy(apiKeyId: string) {
    const cached = this.policyCache.get(apiKeyId);

    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    const policy = await this.prisma.policy.findUnique({
      where: {
        apiKeyId: apiKeyId,
      },
      select: { limit: true, window: true },
    });

    if (!policy || policy.limit == null || policy.window == null) {
      console.error('Invalid rate limit policy', { apiKeyId, policy });
      return null;
    }

    const value = {
      limit: policy.limit,
      window: policy.window,
      expiresAt: Date.now() + 60_000,
    };

    this.policyCache.set(apiKeyId, value);

    return value;
  }

  async tokenBucket(apiKeyId: string, identifier: string) {
    const policy = await this.getPolicy(apiKeyId);

    if (!policy?.limit || !policy?.window) {
      return { allowed: false, reason: 'Invalid policy' };
    }

    const key = `rate_limit:${apiKeyId}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);

    let result: [number, number];

    try {
      result = (await this.redis.eval(
        TOKEN_BUCKET_SCRIPT,
        [key],
        [String(policy.limit), String(policy.window), String(now)],
      )) as [number, number];
    } catch (err) {
      console.error('RATE LIMITER ERROR:', err);
      return {
        allowed: false,
        remaining: policy.limit,
        window: policy.window,
        reason: 'Rate limiter unavailable',
      };
    }

    return {
      allowed: result[0] === 1,
      remaining: Math.floor(result[1]),
    };
  }
}
