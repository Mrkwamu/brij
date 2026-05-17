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
import { ApiKeyDto, GetApiKeysDto } from './apikey.dto';

import { AppRequest } from '../../../decorators/user.decorator';
import { WorkspaceOwnerGuard } from '../workspace.guard';

@Controller('api')
export class ApikeyController {
  constructor(private readonly apikeyService: ApikeyService) {}

  @Post(':slug/create')
  @UseGuards(WorkspaceOwnerGuard)
  async createApikey(@Req() req: AppRequest, @Body() dto: ApiKeyDto) {
    const key = await this.apikeyService.createApiKey(req.workspace.id, dto);

    return {
      message: 'Apikey created',
      key,
    };
  }

  @UseGuards(WorkspaceOwnerGuard)
  @Get('workspace/:slug/keys')
  async getApiKeys(@Req() req: AppRequest, @Query() dto: GetApiKeysDto) {
    const keys = await this.apikeyService.getApiKeys(req.workspace.id, dto);

    return {
      keys,
    };
  }

  @UseGuards(WorkspaceOwnerGuard)
  @Get(':slug/keys/:id')
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
    await this.apikeyService.revokeApiKey(id);

    return {
      message: 'Deleted sucessfully',
    };
  }
}
