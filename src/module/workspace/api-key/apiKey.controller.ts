import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApikeyService } from './apiKey.service';
import { ApiKeyDto, GetApiKeysDto } from './apikey.dto';

import { AppRequest } from '../../../decorators/user.decorator';
import { WorkspaceOwnerGuard } from '../workspace.guard';
import { Public } from '../../../decorators/public.decorator';

@Controller('api')
export class ApikeyController {
  constructor(private readonly apikeyService: ApikeyService) {}

  @Post(':slug/apis')
  @UseGuards(WorkspaceOwnerGuard)
  async createApi(@Req() req: AppRequest, @Body('name') name: string) {
    const workspaceId = req.workspace.id;
    await this.apikeyService.createWorkspaceApi(workspaceId, name);

    return {
      message: 'Api created successfully',
    };
  }

  @Post(':slug/apis/:apiId')
  @UseGuards(WorkspaceOwnerGuard)
  async createApikey(@Param('apiId') apiId: string, @Body() dto: ApiKeyDto) {
    const key = await this.apikeyService.createApiKey(apiId, dto);

    return {
      message: 'Apikey created',
      key,
    };
  }

  @Get(':slug/apis/:apiId/keys')
  @UseGuards(WorkspaceOwnerGuard)
  async getApiKeys(@Param('apiId') apiId: string, @Query() dto: GetApiKeysDto) {
    const keys = await this.apikeyService.getApiKeys(apiId, dto);

    return {
      keys,
    };
  }

  @UseGuards(WorkspaceOwnerGuard)
  @Get(':slug/apis/:apiId/keys/:id')
  async getApiKey(@Param('id') id: string) {
    const key = await this.apikeyService.getApiKey(id);

    return {
      key,
    };
  }

  @UseGuards(WorkspaceOwnerGuard)
  @Patch(':slug/keys/:id')
  async updateKeyName(@Param('id') id: string, @Body() dto: ApiKeyDto) {
    await this.apikeyService.updateApikey(id, dto);

    return {
      message: 'Updated sucessfully',
    };
  }

  @UseGuards(WorkspaceOwnerGuard)
  @Delete('/:slug/keys/:id')
  async deleteKey(@Param('id') id: string) {
    await this.apikeyService.deleteApiKey(id);

    return {
      message: 'Deleted sucessfully',
    };
  }

  @Patch('/:slug/keys/:id/disable')
  async disable(@Param('id') id: string) {
    const status = await this.apikeyService.disableApiKey(id);
    return { status };
  }

  @Patch('/:slug/keys/:id/enable')
  async enable(@Param('id') id: string) {
    const status = await this.apikeyService.enableApiKey(id);
    return { status };
  }
  @Public()
  @Post('verify')
  async verify(@Headers('authorization') authorization: string) {
    const response = await this.apikeyService.verify(authorization);

    return {
      response,
    };
  }
}
