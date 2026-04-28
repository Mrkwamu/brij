import { Body, Controller, Param, Patch } from '@nestjs/common';
import { PolicyService } from './policy.service';
import { PolicyDto } from './policy.dto';
import { User } from '../../../decorators/user.decorator';
import { JwtPayload } from '../../auth/types/auth.types';

@Controller('api/keys/')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Patch(':keyprefix/edit-policy')
  async updateKeyPolicy(
    @Param('keyprefix') keyPrefix: string,
    @Body() dto: PolicyDto,
    @User() user: JwtPayload,
  ) {
    const userId = user.userId;
    const { limit, window } = await this.policyService.updatePolicy(
      dto,
      keyPrefix,
      userId,
    );

    return {
      message: 'Policy edited successfully',
      limit,
      window,
    };
  }
}
