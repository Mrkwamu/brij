/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
    const response = context.switchToHttp().getResponse<Response>();

    const apikeyId = request.apikey?.id;

    if (!apikeyId) {
      throw new UnauthorizedException('Invalid api key');
    }

    const ip = request.ip || request.socket?.remoteAddress;

    if (!ip) {
      throw new HttpException('Unable to resolve IP', HttpStatus.BAD_REQUEST);
    }

    const identifier =
      (request.headers['x-identifier'] as string) || 'anonymous';

    const endpoint: string =
      typeof request.route?.path === 'string'
        ? request.route.path
        : request.url;

    const ctx = {
      apiKeyId: apikeyId,
      workspaceId: request.apikey?.workspaceId,
      identifier,
      ip,
      endpoint,
    };

    const { allowed, remaining, reason } =
      await this.rateLimitService.tokenBucket(ctx);

    if (!allowed) {
      throw new HttpException(
        reason || 'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    response.setHeader('X-RateLimit-Remaining', String(remaining));

    return true;
  }
}
