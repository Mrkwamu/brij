import { SubcribeStatus } from '../../../../generated/prisma/enums';

export interface QuotaCache {
  monthlyQuota: number;
  usedQuota: number;
}

export interface UserPlanResponse {
  plan: string;
  status: SubcribeStatus;
  monthlyQuota: number | null;

  quotaUsed: number;
  quotaResetsAt: Date;
  createdAt: Date;
}
