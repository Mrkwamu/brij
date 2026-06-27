import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PlanType, SubcribeStatus } from '../../../../generated/prisma/enums';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class SelectPlanDto {
  @ApiProperty({
    enum: PlanType,
    example: PlanType.pro,
    description: 'Subscription plan to activate',
  })
  @IsEnum(PlanType)
  plan!: PlanType;
}
export class SelectPlanData {
  @ApiProperty({
    example: 'pro',
    description: 'Current subscription plan',
  })
  plan!: string;

  @ApiProperty({
    enum: SubcribeStatus,
    example: SubcribeStatus.active,
  })
  status!: SubcribeStatus;

  @ApiProperty({
    example: 100000,
    nullable: true,
    description: 'Monthly request quota for the selected plan',
  })
  monthlyQuota!: number | null;

  @ApiProperty({
    example: 1200,
    description: 'Requests used in the current billing cycle',
  })
  quotaUsed!: number;

  @ApiProperty({
    example: '2026-07-01T00:00:00.000Z',
    description: 'When the monthly quota resets',
  })
  quotaResetsAt!: Date;

  @ApiProperty({
    example: '2026-06-27T08:15:00.000Z',
    description: 'When the subscription was created',
  })
  createdAt!: Date;
}

export class SelectPlanResponseDto extends BaseResponseDto {
  @ApiProperty({
    type: SelectPlanData,
  })
  data!: SelectPlanData;
}
