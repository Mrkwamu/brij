import { Body, Controller, Post, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AppRequest } from '../../decorators/user.decorator';

import { ApiOperation } from '@nestjs/swagger';
import {
  ApiConflict,
  ApiNotFound,
  ApiProtectedErrors,
  ApiSuccess,
} from '../../decorators/swagger/api-response.decorator';
import { SelectPlanDto, SelectPlanResponseDto } from './dto/billing.dto';

@Controller('plan')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @ApiOperation({
    summary: 'Select a subscription plan',
  })
  @ApiSuccess(
    'created',
    'Subscription plan selected successfully',
    SelectPlanResponseDto,
  )
  @ApiProtectedErrors()
  @ApiNotFound('User')
  @ApiNotFound('Plan')
  @ApiConflict('You are already subscribed to this plan')
  @Post()
  async sub(
    @Req() req: AppRequest,
    @Body() dto: SelectPlanDto,
  ): Promise<SelectPlanResponseDto> {
    const userId = req.user.userId;

    const data = await this.service.selectPlan(userId, dto.plan);

    return {
      success: true,
      message: 'Subscription plan selected successfully',
      data,
    };
  }
}
