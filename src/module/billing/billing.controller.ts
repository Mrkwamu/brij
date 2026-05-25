import { Body, Controller, ParseEnumPipe, Post, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AppRequest } from '../../decorators/user.decorator';
import { PlanType } from '../../../generated/prisma/enums';

@Controller()
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Post('api/plan')
  async sub(
    @Req() req: AppRequest,
    @Body('plan', new ParseEnumPipe(PlanType)) selectedPlan: PlanType,
  ) {
    const userId = req.user.userId;

    return await this.service.selectPlan(userId, selectedPlan);
  }
}
