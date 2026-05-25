import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanType, SubcribeStatus } from '../../../generated/prisma/enums';
import { Plan, UserPlan } from '../../../generated/prisma/client';

export interface UserPlanResponse {
  plan: string;
  status: SubcribeStatus;
  monthlyQuota: number | null; // null = unlimited
  quotaUsed: number;
  quotaResetsAt: Date;
  createdAt: Date;
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private resetDate(from: Date): Date {
    const date = new Date(from);
    date.setUTCMonth(date.getUTCMonth() + 1);
    return date;
  }

  private response(userPlan: UserPlan & { plan: Plan }): UserPlanResponse {
    return {
      plan: userPlan.plan.name,
      status: userPlan.status,
      monthlyQuota: userPlan.plan.monthlyQuota,
      quotaUsed: userPlan.quotaUsed,
      quotaResetsAt: userPlan.quotaResetsAt,
      createdAt: userPlan.createdAt,
    };
  }

  async assignPlan(
    userId: string,
    plan: Plan,
    existingId?: string,
  ): Promise<UserPlanResponse> {
    const now = new Date();
    const quotaResetsAt = this.resetDate(now);
    const data = {
      userId,
      planId: plan.id,
      status:
        plan.name === PlanType.free
          ? SubcribeStatus.free
          : SubcribeStatus.active,
      quotaUsed: 0,
      quotaResetsAt,
    };

    const userPlan = existingId
      ? await this.prisma.userPlan.update({
          where: { id: existingId },
          data,
          include: { plan: true },
        })
      : await this.prisma.userPlan.create({
          data,
          include: { plan: true },
        });

    return this.response(userPlan);
  }

  async chnagePlan(
    existingPlan: UserPlan & { plan: Plan },
    newPlan: Plan,
    userId: string,
  ): Promise<UserPlanResponse> {
    const PLAN_ORDER: Record<PlanType, number> = {
      [PlanType.free]: 0,
      [PlanType.starter]: 1,
      [PlanType.pro]: 2,
      [PlanType.enterprise]: 3,
    };

    const isUpgrade =
      PLAN_ORDER[newPlan.name as PlanType] >
      PLAN_ORDER[existingPlan.plan.name as PlanType];

    if (
      !isUpgrade &&
      newPlan.monthlyQuota !== null &&
      existingPlan.quotaUsed > newPlan.monthlyQuota
    ) {
      console.log(
        `User ${userId} downgrading with quotaUsed=${existingPlan.quotaUsed} ` +
          `exceeding new plan quota=${newPlan.monthlyQuota}`,
      );
    }

    const updatedPlan = await this.prisma.userPlan.update({
      where: { userId },
      data: {
        planId: newPlan.id,
        status: SubcribeStatus.active,
        // Preserve quotaUsed and quotaResetsAt — billing period doesn't reset on plan change
      },
      include: { plan: true },
    });

    return this.response(updatedPlan);
  }

  async selectPlan(userId: string, planType: PlanType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isVerified: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (!user.isVerified)
      throw new ForbiddenException('Account verification required');

    const selectedPlan = await this.prisma.plan.findUnique({
      where: {
        name: planType,
      },
    });

    if (!selectedPlan) throw new NotFoundException('Plan not found');

    const exisitingPlan = await this.prisma.userPlan.findUnique({
      where: { userId },
      include: {
        plan: true,
      },
    });

    if (!exisitingPlan) {
      return this.assignPlan(userId, selectedPlan);
    }

    if (exisitingPlan.plan.name === planType) {
      throw new BadRequestException(`You are already on the ${planType} plan`);
    }

    if (
      exisitingPlan.status === SubcribeStatus.expired ||
      exisitingPlan.status == SubcribeStatus.canceled
    ) {
      return this.assignPlan(userId, selectedPlan, exisitingPlan.id);
    }

    return this.chnagePlan(exisitingPlan, selectedPlan, userId);
  }
}
