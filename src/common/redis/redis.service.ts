import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private client: Redis;
  constructor(private readonly configSerice: ConfigService) {
    this.client = new Redis({
      url: this.configSerice.get<string>('UPSTASH_REDIS_REST_URL'),
      token: this.configSerice.get<string>('UPSTASH_REDIS_REST_TOKEN'),
    });
  }

  async eval(script: string, keys: string[], args: string[]) {
    return this.client.eval(script, keys, args);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.client.set(key, value, { ex: ttlSeconds });
    }
    return this.client.set(key, value);
  }
}
