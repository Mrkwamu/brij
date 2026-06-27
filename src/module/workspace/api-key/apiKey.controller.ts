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
  ApiKeyStatusResponseDto,
  CreateApiDto,
  CreateApiKeyResponseDto,
  CreateApiResponseDto,
  GetApiKeyResponseDto,
  GetApiKeysDto,
  GetApiKeysResponseDto,
  GetApisDto,
  GetApisResponseDto,
  RevokeApiKeyResponseDto,
  RotateApiKeyDto,
  RotateApiKeyResponseDto,
  UpdateApiKeyResponseDto,
  UpdateApiKeyStatusDto,
} from './dto/apikey.dto';

import { AppRequest } from '../../../decorators/user.decorator';
import { WorkspaceOwnerGuard } from '../workspace.guard';

import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  ApiWorkspaceParams,
  ApiWorkspaceSlugParam,
} from '../../../decorators/swagger/api-param.decorator';
import {
  ApiConflict,
  ApiNotFound,
  ApiProtectedErrors,
  ApiSuccess,
} from '../../../decorators/swagger/api-response.decorator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

@UseGuards(WorkspaceOwnerGuard)
@Controller(':slug/apis')
export class ApikeyController {
  constructor(private readonly apikeyService: ApikeyService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create an Api container',
  })
  @ApiWorkspaceSlugParam()
  @ApiSuccess('created', 'Api created successfully', CreateApiResponseDto)
  @ApiProtectedErrors()
  @Post()
  async createApi(
    @Req() req: AppRequest,
    @Body() dto: CreateApiDto,
  ): Promise<CreateApiResponseDto> {
    const result = await this.apikeyService.createApi(req.workspace.id, dto);

    return {
      success: true,
      message: 'Api created successfully',
      data: result,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get API containers',
  })
  @ApiWorkspaceSlugParam()
  @ApiSuccess('ok', 'API containers retrieved successfully', GetApisResponseDto)
  @ApiProtectedErrors()
  @Get()
  async getApi(
    @Req() req: AppRequest,
    @Query() dto: GetApisDto,
  ): Promise<GetApisResponseDto> {
    const workspaceId = req.workspace.id;

    const data = await this.apikeyService.getApis(workspaceId, dto);
    return {
      success: true,
      message: 'API containers retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create an API key',
  })
  @ApiWorkspaceSlugParam()
  @ApiParam({
    name: 'apiPublicId',
    description: 'Api container public ID',
    example: 'api_Abc1DEF_2u',
  })
  @ApiSuccess(
    'created',
    'API key created successfully',
    CreateApiKeyResponseDto,
  )
  @ApiProtectedErrors()
  @ApiNotFound('API')
  @Post(':apiPublicId/keys')
  async createApikey(
    @Param('apiPublicId') apiPublicId: string,
    @Req() req: AppRequest,
    @Body() dto: ApiKeyDto,
  ): Promise<CreateApiKeyResponseDto> {
    const workspaceId = req.workspace.id;
    const key = await this.apikeyService.createApiKey(
      apiPublicId,
      workspaceId,
      dto,
    );

    return {
      success: true,
      message: 'API key created successfully',
      data: {
        key,
      },
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get API keys',
  })
  @ApiWorkspaceSlugParam()
  @ApiParam({
    name: 'apiPublicId',
    description: 'API container public ID',
    example: 'api_Abc1DEF_2u',
  })
  @ApiSuccess('ok', 'API keys retrieved successfully', GetApiKeysResponseDto)
  @ApiProtectedErrors()
  @ApiNotFound('Api')
  @Get(':apiPublicId/keys')
  async getApiKeys(
    @Param('apiPublicId') apiPublicId: string,
    @Req() req: AppRequest,
    @Query() dto: GetApiKeysDto,
  ): Promise<GetApiKeysResponseDto> {
    const workspaceId = req.workspace.id;
    const data = await this.apikeyService.getApiKeys(
      apiPublicId,
      workspaceId,
      dto,
    );

    return {
      success: true,
      message: 'API keys retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get API keys',
  })
  @ApiWorkspaceParams()
  @ApiSuccess('ok', 'API key retrieved successfully', GetApiKeyResponseDto)
  @ApiProtectedErrors()
  @ApiNotFound('Api Key')
  @Get(':apiPublicId/keys/:apiKeyPublicId')
  async getApiKey(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
  ): Promise<GetApiKeyResponseDto> {
    const workspaceId = req.workspace.id;
    const data = await this.apikeyService.getApiKey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
    );

    return {
      success: true,
      message: 'API key retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update an API key',
  })
  @ApiWorkspaceParams()
  @ApiSuccess('ok', 'API key updated successfully', UpdateApiKeyResponseDto)
  @ApiProtectedErrors()
  @ApiNotFound('Api key')
  @Patch(':apiPublicId/keys/:apiKeyPublicId')
  async updateKeyName(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
    @Body() dto: ApiKeyDto,
  ): Promise<UpdateApiKeyResponseDto> {
    const workspaceId = req.workspace.id;
    const data = await this.apikeyService.updateApikey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
      dto,
    );
    return {
      success: true,
      message: 'API key updated successfully',
      data,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete an Api key',
  })
  @ApiWorkspaceParams()
  @ApiSuccess('ok', 'Api key deleted successfully', BaseResponseDto)
  @ApiProtectedErrors()
  @ApiNotFound('Api key')
  @Delete(':apiPublicId/keys/:apiKeyPublicId')
  async deleteKey(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
  ): Promise<BaseResponseDto> {
    const workspaceId = req.workspace.id;
    await this.apikeyService.deleteApiKey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
    );

    return {
      success: true,
      message: 'Api key deleted successfully',
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update Api key status',
  })
  @ApiWorkspaceParams()
  @ApiSuccess(
    'ok',
    'Api key status updated successfully',
    ApiKeyStatusResponseDto,
  )
  @ApiProtectedErrors()
  @ApiNotFound('Api key')
  @Patch(':apiPublicId/keys/:apiKeyPublicId/status')
  async updateStatus(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
    @Body() dto: UpdateApiKeyStatusDto,
  ): Promise<ApiKeyStatusResponseDto> {
    const workspaceId = req.workspace.id;

    const data = await this.apikeyService.updateApiKeyStatus(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
      dto,
    );

    return {
      success: true,
      message: 'API key status updated successfully',
      data,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Revoke an Api key',
  })
  @ApiWorkspaceParams()
  @ApiSuccess('ok', 'Api key revoked successfully', RevokeApiKeyResponseDto)
  @ApiProtectedErrors()
  @ApiNotFound('Api key')
  @Patch(':apiPublicId/keys/:apiKeyPublicId/revoke')
  async RevokeApiKey(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
  ): Promise<RevokeApiKeyResponseDto> {
    const workspaceId = req.workspace.id;

    const data = await this.apikeyService.rovokeApikey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
    );

    return {
      success: true,
      message: 'API key revoked successfully',
      data,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Rotate an Api key',
  })
  @ApiWorkspaceParams()
  @ApiSuccess(
    'created',
    'Api key rotated successfully',
    RotateApiKeyResponseDto,
  )
  @ApiProtectedErrors()
  @ApiNotFound('Api key')
  @ApiConflict('Api key has already been rotated')
  @Post(':apiPublicId/keys/:apiKeyPublicId/rotate')
  async rotateApiKey(
    @Param('apiPublicId') apiPublicId: string,
    @Param('apiKeyPublicId') apiKeyPublicId: string,
    @Req() req: AppRequest,
    @Body() dto: RotateApiKeyDto,
  ): Promise<RotateApiKeyResponseDto> {
    const workspaceId = req.workspace.id;

    const data = await this.apikeyService.rotateApiKey(
      apiPublicId,
      apiKeyPublicId,
      workspaceId,
      dto.gracePeriod,
    );

    return {
      success: true,
      message: 'API key rotated successfully',
      data,
    };
  }
}
