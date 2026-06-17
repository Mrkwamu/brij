/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { ApiKeyDto, GetApiKeysDto, GetApisDto } from './apikey.dto';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiKeyEnv,
  ApiKeyStatus,
  Prisma,
} from '../../../../generated/prisma/client';
import {
  ApikeyResponse,
  ApikeysResponse,
  ApiKeyStatusResponse,
  ApiResponse,
  UpdateApiKeyStatusDto,
} from './type/apikey.type';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { RedisService } from '../../../common/redis/redis.service';
import { RateLimitingService } from '../../rate-limiting/rate-limiting.service';
import { BillingService } from '../../billing/billing.service';
import { generatePublicId } from '../../../common/utils/helper';

@Injectable()
export class ApikeyService {
  private readonly logger = new Logger(ApikeyService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitingService,
    private readonly billingService: BillingService,
  ) {}

  async createApi(workspaceId: string, name: string): Promise<void> {
    const apiName = name.trim();
    if (!apiName) throw new BadRequestException('Provide a name');
    const publicId = generatePublicId('api');

    try {
      await this.prisma.api.create({
        data: {
          workspaceId,
          name: apiName,
          publicId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create api container', {
        error,
        workspaceId,
      });
      throw new InternalServerErrorException('Failed to create api container');
    }
  }

  async getApis(workspaceId: string, dto: GetApisDto): Promise<ApiResponse[]> {
    const limit = dto.limit ?? 10;
    const result = await this.prisma.api.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        publicId: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return result;
  }

  private async getApiId(
    apiPublicId: string,
    workspaceId: string,
  ): Promise<string> {
    const result = await this.prisma.api.findFirst({
      where: {
        workspaceId,
        publicId: apiPublicId,
      },
      select: {
        id: true,
      },
    });

    if (!result) {
      throw new NotFoundException('Api not found');
    }

    return result.id;
  }

  async createApiKey(
    apiPublicId: string,
    workspaceId: string,
    dto: ApiKeyDto,
  ): Promise<string> {
    const keyName = dto.keyName?.trim() || 'untitled key';
    const prefixName = dto.prefix?.trim().toLowerCase() || 'brij';
    const prefix = crypto.randomBytes(3).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');
    const expiresAt = dto.expiresAt;

    const env = dto.env === ApiKeyEnv.production ? 'live' : 'test';

    const keyPrefix = `${prefixName}_${env}_${prefix}`;
    const generatedApiKey = `${keyPrefix}${secret}`;
    const hashedKey = await this.cryptoService.hash(generatedApiKey);

    const publicId = generatePublicId('key');
    const apiId = await this.getApiId(apiPublicId, workspaceId);

    try {
      await this.prisma.$transaction(async (tx) => {
        const apikey = await tx.apiKey.create({
          data: {
            apiId,
            publicId,
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
      console.error(error);
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to create api key', { error, publicId });
      throw new InternalServerErrorException('Failed to create apikey');
    }
  }

  async getApiKeys(
    apiPublicId: string,
    workspaceId: string,
    dto: GetApiKeysDto,
  ): Promise<ApikeysResponse[]> {
    const limit = dto.limit ?? 10;

    const apiId = await this.getApiId(apiPublicId, workspaceId);

    const api = await this.prisma.api.findUnique({
      where: {
        id: apiId,
      },
      select: {
        apiKeys: {
          select: {
            publicId: true,
            keyName: true,
            keyPrefix: true,
            status: true,
            lastUsedAt: true,
            expiresAt: true,
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return api?.apiKeys ?? [];
  }

  async getApiKey(
    apiPublicId: string,
    apiKeyPublicId: string,
    workspaceId: string,
  ): Promise<ApikeyResponse> {
    const apiId = await this.getApiId(apiPublicId, workspaceId);

    const key = await this.prisma.apiKey.findUnique({
      where: {
        apiId_publicId: {
          apiId,
          publicId: apiKeyPublicId,
        },
      },
      select: {
        publicId: true,
        keyName: true,
        keyPrefix: true,
        permission: true,
        environment: true,
        lastUsedAt: true,
        status: true,
        expiresAt: true,
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

  async updateApikey(
    apiPublicId: string,
    apiKeyPublicId: string,
    workspaceId: string,
    dto: ApiKeyDto,
  ) {
    const apiId = await this.getApiId(apiPublicId, workspaceId);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        apiId_publicId: {
          apiId,
          publicId: apiKeyPublicId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('Apikey not found');
    }

    const data: Prisma.ApiKeyUpdateInput = {};

    if (dto.keyName) data.keyName = dto.keyName.trim();
    if (dto.scope) data.permission = dto.scope;
    if (dto.expiresAt) data.expiresAt = dto.expiresAt;

    if (dto.limit !== undefined || dto.window !== undefined) {
      data.policies = {
        update: {
          where: { apiKeyId: apiKey.id },
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
          id: apiKey.id,
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

  async updateApiKeyStatus(
    apiPublicId: string,
    apiKeyPublicId: string,
    workspaceId: string,
    dto: UpdateApiKeyStatusDto,
  ): Promise<ApiKeyStatusResponse> {
    const apiId = await this.getApiId(apiPublicId, workspaceId);

    try {
      const key = await this.prisma.apiKey.update({
        where: {
          apiId_publicId: {
            apiId,
            publicId: apiKeyPublicId,
          },
        },
        data: {
          status: dto.status,
        },
        select: {
          status: true,
          keyPrefix: true,
          updatedAt: true,
        },
      });

      if (dto.status === ApiKeyStatus.disabled) {
        await this.redisService.del(key.keyPrefix);
      }

      return {
        status: key.status,
        updatedAt: key.updatedAt,
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Apkey not found');
      }
      this.logger.error('Failed to update apikey status', {
        error,
        apiKeyPublicId,
        status: dto.status,
      });

      throw new InternalServerErrorException('Failed to update apikey status');
    }
  }

  async deleteApiKey(
    apiPublicId: string,
    apiKeyPublicId: string,
    workspaceId: string,
  ): Promise<void> {
    const apiId = await this.getApiId(apiPublicId, workspaceId);
    try {
      const result = await this.prisma.apiKey.delete({
        where: {
          apiId_publicId: {
            apiId,
            publicId: apiKeyPublicId,
          },
        },
        select: {
          keyPrefix: true,
        },
      });
      await this.redisService.del(result.keyPrefix);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Apikey already deleted');
        }
      }
      if (error instanceof HttpException) throw error;
      this.logger.error('Failed to revoke api key', { error, apiKeyPublicId });
      throw new InternalServerErrorException('Failed to revoke api key');
    }
  }
}
