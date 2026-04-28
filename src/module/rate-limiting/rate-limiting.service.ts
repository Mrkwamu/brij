import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { TOKEN_BUCKET_SCRIPT } from './rate-limiting.script';

@Injectable()
export class RateLimitingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}
  async tokenBucket(apikeyId: string, identifier: string) {
    //get the policy for the incoming apikey
    const policy = await this.prisma.policy.findUnique({
      where: {
        apiKeyId: apikeyId,
      },
      select: {
        limit: true,
        window: true,
        type: true,
      },
    });

    // if there is no policy we can't rate limit so block it
    if (!policy) {
      return { allowed: false, reason: 'No policy found' };
    }

    const key = `rate_limit:${apikeyId}:${identifier}`;
    const now = Date.now();

    const result = (await this.redis.eval(
      TOKEN_BUCKET_SCRIPT,
      [key],
      [String(policy.limit), String(policy.window), String(now)],
    )) as [number, number, number];
    const allowed = result[0] === 1;
    const remaining = result[1];
    const retry = result[2] === 1;

    if (retry) {
      return {
        allowed: false,
        reason: 'Too many concurrent requests, please retry',
      };
    }

    return { allowed, remaining: Math.floor(remaining) };
  }
}
