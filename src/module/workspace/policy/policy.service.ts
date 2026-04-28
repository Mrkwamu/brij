import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PolicyDto } from './policy.dto';

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async updatePolicy(dto: PolicyDto, keyPrefix: string, userId: string) {
    // verify owner of the key
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        keyPrefix,
        workspace: {
          userId,
        },
      },

      select: {
        id: true,
      },
    });

    if (!apiKey) {
      throw new ForbiddenException('Access denied');
    }

    // 2. update policy
    return this.prisma.policy.update({
      where: {
        apiKeyId: apiKey.id,
      },
      data: {
        limit: dto.limit,
        window: dto.window,
      },
    });
  }
}
