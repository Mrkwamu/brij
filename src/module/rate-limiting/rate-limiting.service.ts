import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { TOKEN_BUCKET_SCRIPT } from './rate-limiting.script';
import { RateLimitContext } from './types/rate-limiting.type';
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

  private async runBucket(key: string, limit: number, window: number) {
    const now = Math.floor(Date.now() / 1000);

    return (await this.redis.eval(
      TOKEN_BUCKET_SCRIPT,
      [key],
      [String(limit), String(window), String(now)],
    )) as [number, number];
  }

  async tokenBucket(ctx: RateLimitContext) {
    const policy = await this.getPolicy(ctx.apiKeyId);

    if (!policy) {
      return { allowed: false, reason: 'Invalid policy' };
    }

    const keys = {
      apiKey: `rate_limit:api:${ctx.apiKeyId}`,
      identifier: `rate_limit:id:${ctx.apiKeyId}:${ctx.identifier}`,
      ip: `rate_limit:ip:${ctx.ip}`,
      route: `rate_limit:route:${ctx.apiKeyId}:${ctx.endpoint}`,
    };

    try {
      const results = await Promise.all([
        this.runBucket(keys.apiKey, policy.limit, policy.window),
        this.runBucket(keys.identifier, policy.limit, policy.window),
        this.runBucket(keys.ip, policy.limit * 2, policy.window),
        this.runBucket(keys.route, policy.limit, policy.window),
      ]);

      const allowed = results.every(([ok]) => ok === 1);
      const remaining = Math.min(...results.map(([, r]) => r));

      return {
        allowed,
        remaining,
        breakdown: {
          apiKey: results[0][0] === 1,
          identifier: results[1][0] === 1,
          ip: results[2][0] === 1,
          route: results[3][0] === 1,
        },
      };
    } catch (err) {
      console.error('RATE LIMITER ERROR:', err);

      return {
        allowed: false,
        remaining: policy.limit,
        reason: 'Rate limiter unavailable',
      };
    }
  }
}
