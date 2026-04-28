// import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { createApiKeyDto } from './apikey.dto';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApikeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  private checkWorkspace(workspaceId: string, userId: string) {
    return this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId,
      },
    });
  }

  async createApiKey(
    dto: createApiKeyDto,
    workspaceId: string,
    userId: string,
  ) {
    const workspace = await this.checkWorkspace(workspaceId, userId);

    if (!workspace) {
      throw new ForbiddenException('Access denied');
    }

    // generate a random string that will be used as the secret key for the user
    const secret = crypto.randomBytes(32).toString('hex');

    const hashedKey = this.cryptoService.hashValue(secret);

    const prefix = dto.prefix?.trim();
    const finalPrefix = prefix && prefix.length > 0 ? prefix : 'brj';

    const lookup = secret.slice(0, 6);

    const keyPrefix = `${finalPrefix}_${lookup}`;
    const apiKey = `${finalPrefix}_${secret}`;

    await this.prisma.$transaction(async (tx) => {
      const apikey = await tx.apiKey.create({
        data: {
          workspaceId: workspaceId,
          keyName: dto.keyName,
          hashedKey,
          keyPrefix,
        },
        select: {
          id: true,
        },
      });

      await tx.policy.create({
        data: {
          apiKeyId: apikey.id,
          limit: dto.limit,
          window: dto.window,
        },
      });
    });

    return {
      apiKey,
    };
  }

  async getAllApiKey(
    workspaceId: string,
    userId: string,
    limit?: number,
    offset?: number,
  ) {
    //authorize
    if (!workspaceId) throw new UnauthorizedException('Select a workspace');

    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId,
      },
    });

    //if the workspace doesn't doesn't belong to use deny
    if (!workspace) {
      throw new ForbiddenException('Access denied');
    }

    //get all api in this workspace
    return this.prisma.apiKey.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        keyName: true,
        keyPrefix: true,
        isRevoked: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'asc' },
    });
  }
}
