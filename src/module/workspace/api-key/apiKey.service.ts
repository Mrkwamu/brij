/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';
import { CryptoService } from '../../../common/crypto/crypto.service';
import { ApiKeyDto, GetApiKeysDto } from './apikey.dto';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyEnv, Prisma } from '../../../../generated/prisma/client';
import { ApiKeyCache, ApikeysResponse } from './type/apikey.type';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { RedisService } from '../../../common/redis/redis.service';
import { RateLimitingService } from '../../rate-limiting/rate-limiting.service';

@Injectable()
export class ApikeyService {
  private readonly logger = new Logger(ApikeyService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitingService,
  ) {}

  async createWorkspaceApi(workspaceId: string, name: string) {
    const apiName = name.trim();
    if (!apiName) throw new BadRequestException('Provide a name');

    try {
      await this.prisma.api.create({
        data: {
          workspaceId,
          name: apiName,
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

  async createApiKey(apiId: string, dto: ApiKeyDto) {
    const keyName = dto.keyname?.trim() || 'untitled key';
    const prefixName = dto.prefix?.trim().toLowerCase() || 'brij';
    const prefix = crypto.randomBytes(3).toString('hex');
    const secret = crypto.randomBytes(32).toString('hex');
    const expiresAt = dto.expiresAt;

    const env = dto.env === ApiKeyEnv.production ? 'live' : 'test';

    const keyPrefix = `${prefixName}_${env}_${prefix}`;
    const generatedApiKey = `${keyPrefix}${secret}`;
    const hashedKey = await this.cryptoService.hash(generatedApiKey);

    try {
      await this.prisma.$transaction(async (tx) => {
        const apikey = await tx.apiKey.create({
          data: {
            apiId,
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
      this.logger.error('Failed to create api key', { error, apiId });
      throw new InternalServerErrorException('Failed to create apikey');
    }
  }

  async getApiKeys(
    apiId: string,
    dto: GetApiKeysDto,
  ): Promise<ApikeysResponse[]> {
    const limit = dto.limit ?? 10;

    const keys = await this.prisma.api.findMany({
      where: {
        id: apiId,
      },
      select: {
        apiKeys: {
          select: {
            id: true,
            keyName: true,
            keyPrefix: true,
            status: true,
            lastUsedAt: true,
            expiresAt: true,
          },
          take: limit,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return keys.flatMap((api) => api.apiKeys);
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
        status: true,
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

  async verify(authorization: string) {
    if (!authorization) throw new BadRequestException('Apikey is missing');

    const apikey = authorization?.split(' ')[1];
    if (!apikey)
      throw new UnauthorizedException('Invalid authorization format');

    const apikeyRegex = /^([a-z][a-z0-9]+)_(live|test)_([a-f0-9]{32,70})$/;
    const match = apikey.match(apikeyRegex);
    if (!match) throw new UnauthorizedException('Invalid api key');

    const [, prefixName, env, secret] = match;
    const prefix = secret.slice(0, 6);
    const lookupKey = `${prefixName}_${env}_${prefix}`;

    try {
      const cached = await this.redisService.get(lookupKey);
      let record: ApiKeyCache | null = null;

      if (cached) {
        record = JSON.parse(cached) as ApiKeyCache;

        console.log('This is the cached own', record);
      } else {
        const dbRecord = await this.prisma.apiKey.findUnique({
          where: {
            keyPrefix: lookupKey,
          },
          select: {
            id: true,
            hashedKey: true,
            permission: true,
            status: true,
            lastUsedAt: true,
            expiresAt: true,
            policies: {
              select: {
                limit: true,
                window: true,
                type: true,
              },
            },
          },
        });

        if (!dbRecord)
          throw new UnauthorizedException('Api key does not exist');

        if (!dbRecord.policies) {
          throw new InternalServerErrorException('Policy missing for API key');
        }

        record = {
          id: dbRecord.id,
          hashedKey: dbRecord.hashedKey,
          permission: dbRecord.permission,
          lastUsedAt: dbRecord.lastUsedAt,
          expiresAt: dbRecord.expiresAt,
          status: dbRecord.status,
          policies: dbRecord.policies,
        };
      }

      if (record.status !== 'active')
        throw new UnauthorizedException('Unauthorized');
      if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
        throw new UnauthorizedException('Api key has expired');
      }

      const isKeyMatch = await this.cryptoService.compareHash(
        apikey,
        record.hashedKey,
      );

      if (!isKeyMatch) throw new UnauthorizedException('Invalid api key');
      // const rateLimitResult = await this.rateLimitService.tokenBucket();

      await this.redisService.set(lookupKey, JSON.stringify(record), 60);

      void this.prisma.apiKey.update({
        where: { keyPrefix: lookupKey },
        data: { lastUsedAt: new Date() },
      });
      return {
        valid: true,
        permission: record.permission,
        expiresAt: record.expiresAt,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      console.log(err);
      throw new InternalServerErrorException('Failed to verify');
    }
  }

  async enableApiKey(id: string) {
    await this.prisma.apiKey.update({
      where: { id },
      data: { status: 'active' },
      select: { keyPrefix: true },
    });

    return 'active';
  }

  async disableApiKey(id: string) {
    const key = await this.prisma.apiKey.update({
      where: { id },
      data: { status: 'disabled' },
      select: { keyPrefix: true },
    });

    await this.redisService.del(key.keyPrefix);
    return 'disabled';
  }

  async deleteApiKey(id: string) {
    try {
      const result = await this.prisma.apiKey.delete({
        where: {
          id,
        },
        select: {
          keyPrefix: true,
        },
      });
      

      const lookupKey = result.keyPrefix;

      await this.redisService.del(lookupKey);
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

// brij_live_31d0ec506b0d9a9691288e76b65ec7babc6cbe83f69e9c7fa15dc4db86cf3d8b5b7c1f;
// brijdata_live_761991d612a72fa501eecea5b0b871090fcaaba8c8c315e29d7cdf388f301b08b53494;
