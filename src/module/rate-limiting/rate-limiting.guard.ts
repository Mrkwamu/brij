import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RateLimitingService } from './rate-limiting.service';

@Injectable()
export class RateLimitingGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitingService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const identifier = request.headers['x-brij-identifier'] as string;

    const apikeyId = request.apikey?.id;

    //when api key does't have an apikeyId attached to it
    if (!apikeyId) throw new UnauthorizedException('Invalid api key');
    //if identifer is missing return an error
    if (!identifier) throw new UnauthorizedException('Identifier missing ');

    const { allowed, remaining, reason } =
      await this.rateLimitService.tokenBucket(apikeyId, identifier);

    if (!allowed) {
      throw new HttpException(
        reason || 'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader('X-RateLimit-Remaining', String(remaining));

    return true;
  }
}
