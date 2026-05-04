import { Injectable } from '@nestjs/common';
import {
  AlgorithmType,
  UsageLogsStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';

export interface UsageLogType {
  apiKeyId: string;
  identifier: string;
  status: UsageLogsStatus;
  limit: number;
  remaining: number;
  resetAt?: Date;
  algorithm: AlgorithmType;
}

@Injectable()
export class UsageLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async logUsage(logs: UsageLogType) {
    await this.prisma.usageLogs.create({
      data: {
        apiKeyId: logs.apiKeyId,
        identifier: logs.identifier,
        status: logs.status,
        limit: logs.limit,
        remaining: logs.remaining,
        algorithmType: logs.algorithm,
      },
    });
  }
}
