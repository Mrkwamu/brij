import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

type RedisBucket = {
  tokens: number;
  lastRefill: number;
};
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
    // unique key in redis for this apikey and this specific person making the request
    const key = `rate_limit:${apikeyId}:${identifier}`; //the identifier i set is for people using brij what they use to identify their users

    // check if this person has a bucket already in redis
    const bucket = await this.redis.get(key);
    let tokens: number; // how many requsts left
    let lastRefill: number; /// when last was the state updated
    const now = Date.now();

    if (!bucket) {
      // first time this person is using this apikey
      // give them a full bucket minus the one they just spent
      tokens = policy.limit! - 1;
      lastRefill = now;
      // save their fresh bucket to redis
      // it expires after the window
      await this.redis.set(
        key,
        JSON.stringify({ tokens, lastRefill }),
        policy.window!,
      );

      return { allowed: true, remaining: tokens };
    }
    // bucket exists so this person has been here before
    console.log(bucket);
    console.log(typeof bucket);
    const parsed = bucket as RedisBucket;
    tokens = parsed.tokens;
    lastRefill = parsed.lastRefill;

    //get how many secs passed after we updated their bucket
    const timePassed = (now - lastRefill) / 1000;
    // how many tokens come back per second based on their policy
    const tokensPerSecond = policy.limit! / policy.window!;

    // how many tokens came back in the time that passed then we roundup so we won't have a half token
    const tokensToAdd = Math.floor(timePassed * tokensPerSecond);

    tokens = Math.min(policy.limit!, tokens + tokensToAdd); // add the refilled tokens back but never go above the max
    lastRefill = now;

    if (tokensToAdd > 0) {
      lastRefill = now;
    }

    // no tokens left so block the request
    if (tokens < 1) {
      await this.redis.set(
        key,
        JSON.stringify({
          tokens,
          lastRefill,
        }),
      );
      return { allowed: false, remaining: 0 };
    }
    // they have tokens so use one and allow the request
    tokens -= 1;

    await this.redis.set(key, JSON.stringify({ tokens, lastRefill }));

    return {
      allowed: true,
      remaining: Math.floor(tokens),
    };
  }
}
