/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { ApiKeyDto, GetApiKeysDto } from './apikey.dto';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiKeyEnv, Prisma } from '../../../../generated/prisma/client';
import { ApikeysResponse } from './type/apikey.type';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class ApikeyService {
  private readonly logger = new Logger(ApikeyService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async createApiKey(workspaceId: string, dto: ApiKeyDto) {
    const keyName = dto.keyname?.trim() || 'untitled key';
    const prefixName = dto.prefix?.trim().toLowerCase() || 'brij';
    const secret = crypto.randomBytes(24).toString('hex');
    const expiresAt = dto.expiresAt;

    const env = dto.env === ApiKeyEnv.production ? 'live' : 'test';

    const lookup = secret.slice(0, 6);
    const keyPrefix = `${prefixName}_${env}_${lookup}`;
    const generatedApiKey = `${prefixName}_${env}_${secret}`;
    const hashedKey = await this.cryptoService.hash(generatedApiKey);

    try {
      await this.prisma.$transaction(async (tx) => {
        const apikey = await tx.apiKey.create({
          data: {
            workspaceId,
            keyName,
            hashedKey,
            keyPrefix,
            permission: dto.scope,
            environment: dto.env,
            expiresAt,
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

      return generatedApiKey;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to create api key', { error, workspaceId });
      throw new InternalServerErrorException('Failed to create apikey');
    }
  }

  async getApiKeys(
    workspaceId: string,
    dto: GetApiKeysDto,
  ): Promise<ApikeysResponse[]> {
    const limit = dto.limit ?? 10;

    const keys = await this.prisma.apiKey.findMany({
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
      orderBy: { createdAt: 'asc' },
    });

    return keys;
  }

  async getApiKey(id: string) {
    const key = await this.prisma.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        keyName: true,
        keyPrefix: true,
        permission: true,
        environment: true,
        lastUsedAt: true,
        isRevoked: true,
        revokedAt: true,
        createdAt: true,
        policies: {
          select: {
            limit: true,
            window: true,
          },
        },
      },
    });

    if (!key) {
      throw new NotFoundException('Api key not found');
    }

    return key;
  }

  async updateApikey(id: string, dto: ApiKeyDto) {
    const data: Prisma.ApiKeyUpdateInput = {};

    if (dto.keyname) data.keyName = dto.keyname.trim();
    if (dto.scope) data.permission = dto.scope;
    if (dto.expiresAt) data.expiresAt = dto.expiresAt;

    if (dto.limit !== undefined || dto.window !== undefined) {
      data.policies = {
        update: {
          where: { apiKeyId: id },
          data: {
            ...(dto.limit !== undefined && { limit: dto.limit }),
            ...(dto.window !== undefined && { window: dto.window }),
          },
        },
      };
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    try {
      return await this.prisma.apiKey.update({
        where: {
          id,
        },
        data,
        select: {
          keyName: true,
          permission: true,
          expiresAt: true,
          updatedAt: true,
          policies: {
            select: {
              limit: true,
              window: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Api key not found');
        }
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update');
    }
  }

  async revokeApiKey(id: string) {
    try {
      await this.prisma.apiKey.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Apikey already deleted');
        }
      }
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to revoke api key', { error, id });
      throw new InternalServerErrorException('Failed to revoke api key');
    }
  }
}

// free_2UkMqCVnk44VRDaUBTNrCsLoe2oRh35QA8BMYYrFVrg6gJ;
// fake_live_ab383bf80a7066f580dd11ace0352148489d3dce7985d24d
