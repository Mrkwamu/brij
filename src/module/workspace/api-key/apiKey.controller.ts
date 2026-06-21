import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApikeyService } from './apiKey.service';
import {
  ApiKeyDto,
  GetApiKeysDto,
  GetApisDto,
  RotateApiKeyDto,
} from './apikey.dto';

import { AppRequest } from '../../../decorators/user.decorator';
import { WorkspaceOwnerGuard } from '../workspace.guard';

import { UpdateApiKeyStatusDto } from './type/apikey.type';

@UseGuards(WorkspaceOwnerGuard)
@Controller(':slug/apis')
export class ApikeyController {
  constructor(private readonly apikeyService: ApikeyService) {}

  @Post()
  async createApi(@Req() req: AppRequest, @Body('name') name: string) {
    const workspaceId = req.workspace.id;
    await this.apikeyService.createApi(workspaceId, name);

    return {
      message: 'Api created successfully',
    };
  }

  @Get()
  async getApi(@Req() req: AppRequest, @Query() dto: GetApisDto) {
    const workspaceId = req.workspace.id;

    const data = await this.apikeyService.getApis(workspaceId, dto);

    return {
      data,
    };
  }

  @Post(':apiPublicId/keys')
  async createApikey(
    @Param('apiPublicId') apiPublicId: string,
    @Req() req: AppRequest,
    @Body() dto: ApiKeyDto,
  ) {
    const workspaceId = req.workspace.id;
    const key = await this.apikeyService.createApiKey(
      apiPublicId,
      workspaceId,
      dto,
    );

    return {
      key,
    };
  }

  @Get(':apiPublicId/keys')
  async getApiKeys(
    @Param('apiPublicId') apiPublicId: string,
    @Req() req: AppRequest,
    @Query() dto: GetApiKeysDto,
  ) {
    const workspaceId = req.workspace.id;
    const keys = await this.apikeyService.getApiKeys(
      apiPublicId,
      workspaceId,
      dto,
    );

    return {
      keys,
    };
  }

  @Get(':apiPublicId/keys/:apiKeyPublicId')
  async getApiKey(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
  ) {
    const workspaceId = req.workspace.id;
    const key = await this.apikeyService.getApiKey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
    );

    return {
      key,
    };
  }

  @Patch(':apiPublicId/keys/:apiKeyPublicId')
  async updateKeyName(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
    @Body() dto: ApiKeyDto,
  ) {
    const workspaceId = req.workspace.id;
    await this.apikeyService.updateApikey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
      dto,
    );

    return {
      message: 'Updated sucessfully',
    };
  }

  @Delete(':apiPublicId/keys/:apiKeyPublicId')
  async deleteKey(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
  ) {
    const workspaceId = req.workspace.id;
    await this.apikeyService.deleteApiKey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
    );

    return {
      message: 'Deleted sucessfully',
    };
  }
  @Patch(':apiPublicId/keys/:apiKeyPublicId/status')
  async updateStatus(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
    @Body() dto: UpdateApiKeyStatusDto,
  ) {
    const workspaceId = req.workspace.id;

    const key = await this.apikeyService.updateApiKeyStatus(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
      dto,
    );

    return {
      message: 'API key status updated successfully',
      key,
    };
  }

  @Patch(':apiPublicId/keys/:apiKeyPublicId/revoke')
  async RevokeApiKey(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
  ) {
    const workspaceId = req.workspace.id;

    const key = await this.apikeyService.rovokeApikey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
    );

    return {
      message: 'API key revoked successfully',
      key,
    };
  }
  @Post(':apiPublicId/keys/:apiKeyPublicId/rotate')
  async rotateApiKey(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
    @Body() dto: RotateApiKeyDto,
  ) {
    const workspaceId = req.workspace.id;

    const key = await this.apikeyService.rotateApiKey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
      dto.gracePeriod,
    );
    return { key };
  }
}
