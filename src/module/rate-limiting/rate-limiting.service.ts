import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';
import { TOKEN_BUCKET_SCRIPT } from './rate-limiting.luascript';
import {
  LuaResult,
  RateLimitCtx,
  RateLimitPolicy,
  RateLimitResult,
} from './types/rate-limiting.type';

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  constructor(private readonly redis: RedisService) {}

  async checkLimit(
    ctx: RateLimitCtx,
    rlPolicy: RateLimitPolicy,
  ): Promise<RateLimitResult> {
    const bucketKey =
      ctx.identifier && ctx.namespace
        ? `${ctx.lookupKey}:${ctx.namespace}:${ctx.identifier}`
        : `${ctx.lookupKey}`;

    const result = await this.runBucket(
      bucketKey,
      rlPolicy.limit,
      rlPolicy.window,
    );

    return result;
  }

  private async runBucket(key: string, limit: number, window: number) {
    const redisKey = `rl:${key}`;
    const now = Math.floor(Date.now() / 1000);

    if (limit <= 0) {
      throw new BadRequestException('Invalid limit');
    }

    if (window <= 0) {
      throw new BadRequestException('Invalid window');
    }

    try {
      const result = (await this.redis.eval(TOKEN_BUCKET_SCRIPT, redisKey, [
        limit,
        window,
        now,
      ])) as LuaResult;

      const [allowed, remaining, defaultLimit, resetAt] = result;

      return {
        allowed: allowed === 1,
        remaining,
        limit: defaultLimit,
        resetAt,
      };
    } catch (error) {
      this.logger.error(error);

      return {
        allowed: false,
        remaining: 0,
        limit,
        resetAt: now + window,
      };
    }
  }
}
