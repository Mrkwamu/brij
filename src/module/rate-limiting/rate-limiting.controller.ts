import { Body, Controller, Post } from '@nestjs/common';
import { RateLimitingService } from './rate-limiting.service';
import { Public } from '../../decorators/public.decorator';

@Controller('api/test')
export class RateLimitingController {
  constructor(private readonly rateLimitingService: RateLimitingService) {}
  @Public()
  @Post('ratelimit')
  async testing(@Body() body: { apiKey: string; identifier: string }) {
    const result = await this.rateLimitingService.tokenBucket({
      apiKeyId: body.apiKey,
      identifier: body.identifier,
      ip: '127.0.0.1',
      endpoint: '/test',
    });

    return result;
  }
}
