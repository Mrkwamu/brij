import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}
  private client!: Redis;

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),

      retryStrategy: (times) => {
        return Math.min(times * 50, 2000); // backoff
      },

      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    });

    this.client.on('connect', () => console.log('Redis connected'));
    this.client.on('error', (err) => console.error('Redis error', err));
  }

  onModuleDestroy() {
    this.client.quit();
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis not initialized');
    }
    return this.client;
  }

  async eval(script: string, keys: string, args: (string | number)[]) {
    return this.client.eval(script, 1, keys, ...args);
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    await this.client.del(keys);
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number) {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      return this.client.set(key, stringValue, 'EX', ttlSeconds);
    }

    return this.client.set(key, stringValue);
  }

  async hset(key: string, field: string | object, value?: string | number) {
    if (typeof field === 'object') {
      await this.client.hset(key, field);
    } else {
      await this.client.hset(key, field, value!);
    }
  }

  async hgetall(key: string) {
    return this.client.hgetall(key);
  }

  async incrby(key: string, field: string, increment: number): Promise<number> {
    return await this.client.hincrby(key, field, increment);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }
}
