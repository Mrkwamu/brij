import { Body, Controller, Post } from '@nestjs/common';
import { RateLimitingService } from './rate-limiting.service';
import { Public } from '../../decorators/public.decorator';

@Controller('api/test')
export class RateLimitingController {
  constructor(private readonly rateLimitingService: RateLimitingService) {}
  @Public()
  @Post('ratelimit')
  async testing(@Body() body: { apiKey: string; identifier: string }) {
    const { allowed, remaining, reason } =
      await this.rateLimitingService.tokenBucket(body.apiKey, body.identifier);

    return {
      allowed,
      remaining,
      reason,
    };
  }
}
