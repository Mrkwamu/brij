import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AppRequest, User } from '../../decorators/user.decorator';
import { JwtPayload } from '../auth/types/auth.types';
import { WorkspaceService } from './workspace.service';
import { Public } from '../../decorators/public.decorator';
import { RateLimitingGuard } from '../rate-limiting/rate-limiting.guard';
import { ApikeyGuard } from './api-key/api-key.guard';
import { WorkSpaceDto } from './type/dto';
import { WorkspaceOwnerGuard } from './workspace.guard';

@Controller('api/workspace')
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Post()
  async createWorkspace(@Body() dto: WorkSpaceDto, @User() user: JwtPayload) {
    const userId = user.userId;

    const response = await this.workspace.createWorkspace(userId, dto);

    return {
      message: 'Workspace created successfully',
      response,
    };
  }

  @Get('workspaces')
  async getAllWorkspace(
    @User() user: JwtPayload,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const userId = user.userId;

    const response = await this.workspace.getWorkspaces(userId, limit);

    return {
      response,
    };
  }

  @UseGuards(WorkspaceOwnerGuard)
  @Get(':slug')
  async getWorkspace(@Req() req: AppRequest) {
    const id = req.workspace.id;
    const response = await this.workspace.getWorkspace(id);

    return {
      response,
    };
  }

  @UseGuards(WorkspaceOwnerGuard)
  @Patch(':slug/general')
  async updateWorkspace(
    @Param('slug') slug: string,
    @Body() dto: WorkSpaceDto,
  ) {
    const response = await this.workspace.updateWorkspace(slug, dto);

    return {
      response,
    };
  }

  @UseGuards(WorkspaceOwnerGuard)
  @Delete(':slug')
  async deleteWorkspace(@Req() req: AppRequest) {
    const id = req.workspace.id;
    await this.workspace.deleteWorkspace(id);

    return {
      message: 'Workspace deleted successfully',
    };
  }

  @Public()
  @UseGuards(ApikeyGuard, RateLimitingGuard)
  @Post('check')
  check() {
    return {
      message: 'sucessfully guarded lol',
    };
  }
}
