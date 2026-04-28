import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApikeyService } from './apiKey.service';
import { createApiKeyDto } from './apikey.dto';
import { JwtPayload } from '../../auth/types/auth.types';
import { User } from '../../../decorators/user.decorator';

@Controller('api')
export class ApikeyController {
  constructor(private readonly apikeyService: ApikeyService) {}

  @Post(':workspaceId/create')
  async createApikey(
    @Param('workspaceId') workspaceId: string,
    @User() user: JwtPayload,
    @Body() dto: createApiKeyDto,
  ) {
    const userId = user.userId;
    const { apiKey } = await this.apikeyService.createApiKey(
      dto,
      workspaceId,
      userId,
    );

    return {
      message: 'Apikey created',
      apiKey,
    };
  }

  @Get('get/:id/keys') // i passed the workspace id here in the url
  async getApiKeys(
    @Param('id') workspaceId: string,
    @User() user: JwtPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = user.userId;
    const result = await this.apikeyService.getAllApiKey(
      workspaceId,
      userId,
      limit,
      offset,
    );

    return {
      message: 'Successful',
      result,
    };
  }
}
