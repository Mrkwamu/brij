import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JsonWebTokenError,
  JwtService,
  NotBeforeError,
  TokenExpiredError,
} from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from './types/auth.types';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { AuthRequest } from '../../decorators/user.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    //  Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If public skip auth
    if (isPublic) {
      return true;
    }

    //  Protected routes require token
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token is missing or malformed');
    }

    //  Verify token
    const payload = this.validate(token);

    // Attach user to request
    request.user = payload;

    return true;
  }

  validate(accessToken: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(accessToken, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        issuer: this.configService.get<string>('APP_NAME'),
        audience: 'users',
      });
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }

      if (err instanceof NotBeforeError) {
        throw new UnauthorizedException('Token not active yet');
      }

      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
