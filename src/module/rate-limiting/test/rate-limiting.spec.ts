import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { RedisService } from '../../../common/redis/redis.service';

interface RateLimitResponse {
  allowed: boolean;
  remaining: number;
  reason?: string;
}

const apiKey = '3ea3d300-4864-456e-90ca-e0804b277b96';
const identifier = '192:02:11';
const key = `rate_limit:${apiKey}:${identifier}`;

describe('Rate Limiting Integration', () => {
  let app: INestApplication;
  let redisService: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    redisService = app.get(RedisService);

    await redisService.getClient().ping();
  });

  beforeEach(async () => {
    await redisService.del(key);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow a normal request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/test/ratelimit')
      .send({ apiKey, identifier });

    const body = res.body as RateLimitResponse;
    expect(body.allowed).toBe(true);
    expect(body.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should decrease remaining tokens over requests', async () => {
    const results: number[] = [];

    for (let i = 0; i < 3; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/test/ratelimit')
        .send({ apiKey, identifier });

      const body = res.body as RateLimitResponse;
      results.push(body.remaining);
    }

    expect(results[1]).toBeLessThanOrEqual(results[0]);
    expect(results[2]).toBeLessThanOrEqual(results[1]);
  });

  it('should block requests after limit is exceeded', async () => {
    let blocked = false;

    for (let i = 0; i < 20; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/test/ratelimit')
        .send({ apiKey, identifier });

      const body = res.body as RateLimitResponse;

      if (!body.allowed) {
        blocked = true;
        break;
      }
    }

    expect(blocked).toBe(true);
  });
});
