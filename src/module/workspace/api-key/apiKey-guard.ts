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

    if (!authHeader)
      throw new UnauthorizedException('Missing authorization header');

    const [scheme, fullKey] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !fullKey) {
      throw new UnauthorizedException('Malformed authorization header');
    }

    const parts = fullKey.split('_');

    if (parts.length !== 2)
      throw new UnauthorizedException('Invalid API key format');

    const [prefix, secret] = parts;

    if (!prefix || !secret) {
      throw new UnauthorizedException('Invalid API key structure');
    }

    const shortened = secret.slice(0, 6); // get the first 6 characters i.e abcded
    const keyPrefix = `${prefix}_${shortened}`; //combine them it gives brj_abcded

    const { id, workspaceId } = await this.validateApikey(keyPrefix, secret);

    request.apikey = {
      id,
      workspaceId,
    };

    return true;
  }

  async validateApikey(keyPrefix: string, secretKey: string) {
    const lookup = await this.prisma.apiKey.findUnique({
      where: { keyPrefix },
      select: {
        id: true,
        workspaceId: true,
        hashedKey: true,
        isRevoked: true,
      },
    });

    // hash the incroming secret
    const incomingHash = this.cryptoService.hashValue(secretKey);

    // create a fake hash so we always do the comparison
    // even if the key doesn't exist
    const storedHash = lookup?.hashedKey ?? 'a'.repeat(incomingHash.length);

    const hashBuffer = Buffer.from(incomingHash);
    const storedBuffer = Buffer.from(storedHash);

    const isValid =
      hashBuffer.length === storedBuffer.length &&
      timingSafeEqual(hashBuffer, storedBuffer);

    if (!lookup || !isValid || lookup.isRevoked) {
      throw new UnauthorizedException('Unauthorized');
    }

    return lookup;
  }
}
