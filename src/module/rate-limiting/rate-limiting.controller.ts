import { Controller, Post } from '@nestjs/common';
import { RateLimitingService } from './rate-limiting.service';
import { Public } from '../../decorators/public.decorator';

@Controller('api/test')
export class RateLimitingController {
  constructor(private readonly rateLimitingService: RateLimitingService) {}
  @Public()
  @Post('ratelimit')
  async testing() {
    const { allowed, remaining, reason } =
      await this.rateLimitingService.tokenBucket(
        '152f4f0b-e49e-42ea-8c18-27a8fae63841',
        '192:02:11',
      );

    return {
      message: 'successful',
      allowed,
      remaining,
      reason,
    };
  }
}
