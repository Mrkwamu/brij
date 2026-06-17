import { Controller, Post, Headers, Body } from '@nestjs/common';
import { Public } from '../../../decorators/public.decorator';
import { VerifyService } from './verify.service';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}
  @Public()
  @Post()
  async verify(
    @Headers('authorization') authorization: string,
    @Body('namespace') namespace?: string,
    @Body('identifier') identifier?: string,
  ) {
    const response = await this.verifyService.verify(
      authorization,
      namespace,
      identifier,
    );
    return { response };
  }
}
