import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { CryptoService } from '../../../common/crypto/crypto.service';

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

    await this.validateApikey(keyPrefix, secret);

    return true;
  }

  async validateApikey(keyPrefix: string, secretKey: string) {
    //look for the apikey by using prefix-key
    const lookup = await this.prisma.apiKey.findUnique({
      where: {
        keyPrefix,
      },
      select: {
        hashedKey: true,
        isRevoked: true,
      },
    });

    if (!lookup) throw new UnauthorizedException('Invalid api key'); //if the prefix don't exist

    if (lookup.isRevoked)
      throw new UnauthorizedException('Invalid or revoked API key');
    //hash the secretKey so we can compare it to the one we gave in the db
    const secret = this.cryptoService.hashValue(secretKey);
    if (secret !== lookup.hashedKey)
      throw new UnauthorizedException('Invalid api key'); //if the prefix don't exist
  }
}
