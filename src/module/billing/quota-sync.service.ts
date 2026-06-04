// quota-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class QuotaSyncService {
  private readonly logger = new Logger(QuotaSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Cron('*/60 * * * * *')
  async syncQuotaToDB(): Promise<void> {
    try {
      const keys = await this.redis.keys('quota:*');
      if (!keys.length) return;

      const updates: { userId: string; usedQuota: number }[] = [];

      for (const key of keys) {
        const userId = key.split(':')[1];
        const data = await this.redis.hgetall(key);
        if (!data || data.usedQuota === undefined) continue;
        updates.push({
          userId,
          usedQuota: parseInt(data.usedQuota),
        });
      }

      if (!updates.length) return;

      await this.prisma.$transaction(
        updates.map(({ userId, usedQuota }) =>
          this.prisma.userPlan.update({
            where: { userId },
            data: { quotaUsed: usedQuota },
          }),
        ),
      );

      this.logger.log(`Synced quota for ${updates.length} users`);
    } catch (error) {
      this.logger.error('Quota sunc failed', error);
    }
  }
}
