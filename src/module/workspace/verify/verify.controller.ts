import { Controller, Post, Headers, Body, Req } from '@nestjs/common';
import { Public } from '../../../decorators/public.decorator';
import { VerifyService } from './verify.service';
import { VerifyDto, VerifyResponseDto } from './dto/verify.dto';
import { ApiSuccess } from '../../../decorators/swagger/api-response.decorator';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Public()
  @ApiBearerAuth('api-key')
  @ApiOperation({
    summary: 'Verify an Api key',
    description:
      'Verifies an API key, checks its status, subscription quota, and rate limits.',
  })
  @ApiSuccess('ok', 'API key verified successfully', VerifyResponseDto)
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, revoked, or inactive API key',
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded. Please try again later',
  })
  @Post()
  async verify(
    @Req() req: Request,
    @Body() dto: VerifyDto,
  ): Promise<VerifyResponseDto> {
    const authorization = req.headers['authorization'] as string;
    const data = await this.verifyService.verify(authorization, dto);
    return {
      success: true,
      message: 'API key verified successfully',
      data,
    };
  }
}
