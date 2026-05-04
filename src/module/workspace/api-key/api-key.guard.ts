import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class ApikeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, ...rest] = authHeader.split(' ');
    const fullKey = rest.join(' ');

    if (scheme !== 'Bearer' || !fullKey) {
      throw new UnauthorizedException('Malformed authorization header');
    }

    const parts = fullKey.split('_');

    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const [prefix, secret] = parts;
    const shortened = secret.slice(0, 6);
    const keyPrefix = `${prefix}_${shortened}`;

    const lookup = await this.prisma.apiKey.findUnique({
      where: { keyPrefix },
      select: {
        id: true,
        workspaceId: true,
        hashedKey: true,
        isRevoked: true,
      },
    });

    if (!lookup) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (lookup.isRevoked) {
      throw new UnauthorizedException('Unauthorized');
    }

    const incomingHash = this.cryptoService.hashValue(secret);

    const incomingBuffer = Buffer.from(incomingHash, 'hex');
    const storedBuffer = Buffer.from(lookup.hashedKey, 'hex');

    if (
      incomingBuffer.length !== storedBuffer.length ||
      !timingSafeEqual(incomingBuffer, storedBuffer)
    ) {
      throw new UnauthorizedException('Unauthorized');
    }

    request.apikey = {
      id: lookup.id,
      workspaceId: lookup.workspaceId,
    };

    return true;
  }
}
