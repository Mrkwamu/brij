import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RateLimitingService } from './rate-limiting.service';

@Injectable()
export class RateLimitingGuard implements CanActivate {
  constructor(private readonly rateLimitService: RateLimitingService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const identifier = request.headers['x-brij-identifier'] as string;

    const apikeyId = request.apikey?.id;
    console.log(apikeyId);
    //when api key does't have an apikeyId attached to it
    if (!apikeyId) throw new UnauthorizedException('Invalid api key');
    //if identifer is missing return an error
    if (!identifier) throw new UnauthorizedException('Identifier missing ');

    const { allowed, reason } = await this.rateLimitService.tokenBucket(
      apikeyId,
      identifier,
    );

    if (!allowed)
      throw new HttpException(
        reason || 'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );

    return true;
  }
}
