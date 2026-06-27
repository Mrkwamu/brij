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
  UseGuards,
} from '@nestjs/common';

import { User } from '../../decorators/user.decorator';
import { JwtPayload } from '../auth/types/auth.types';
import { WorkspaceService } from './workspace.service';

import { WorkspaceOwnerGuard } from './workspace.guard';
import {
  CreateWorkspaceResponseDto,
  GetAllWorkspaceResponseDto,
  GetWorkspaceResponseDto,
  UpdateWorkspaceResponseDto,
  WorkSpaceDto,
} from './dto/workspace.dto';

import {
  ApiConflict,
  ApiNotFound,
  ApiProtectedErrors,
  ApiSuccess,
} from '../../decorators/swagger/api-response.decorator';
import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { ApiWorkspaceSlugParam } from '../../decorators/swagger/api-param.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a workspace',
  })
  @ApiSuccess(
    'created',
    'Workspace created successfully',
    CreateWorkspaceResponseDto,
  )
  @ApiConflict('Workspace slug already exists')
  @ApiProtectedErrors()
  @Post()
  async createWorkspace(
    @Body() dto: WorkSpaceDto,
    @User() user: JwtPayload,
  ): Promise<CreateWorkspaceResponseDto> {
    const response = await this.workspace.createWorkspace(user.userId, dto);

    return {
      success: true,
      message: 'Workspace created successfully',
      data: response,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all workspaces',
  })
  @ApiSuccess(
    'ok',
    'Workspaces fetched successfully',
    GetAllWorkspaceResponseDto,
  )
  @ApiProtectedErrors()
  @Get()
  async getAllWorkspace(
    @User() user: JwtPayload,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<GetAllWorkspaceResponseDto> {
    const response = await this.workspace.getWorkspaces(user.userId, limit);

    return {
      success: true,
      message: 'Workspaces fetched successfully',
      data: response,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get a workspace',
  })
  @ApiWorkspaceSlugParam()
  @ApiSuccess('ok', 'Workspace fetched successfully', GetWorkspaceResponseDto)
  @ApiNotFound('Workspace')
  @ApiProtectedErrors()
  @UseGuards(WorkspaceOwnerGuard)
  @Get(':slug')
  async getWorkspace(@Param('slug') slug: string) {
    const response = await this.workspace.getWorkspace(slug);

    return {
      success: true,
      message: 'Workspace fetched successfully',
      data: response,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update workspace',
  })
  @ApiWorkspaceSlugParam()
  @ApiSuccess(
    'ok',
    'Workspace updated successfully',
    UpdateWorkspaceResponseDto,
  )
  @ApiNotFound('Workspace')
  @ApiProtectedErrors()
  @UseGuards(WorkspaceOwnerGuard)
  @Patch(':slug/general')
  async updateWorkspace(
    @Param('slug') slug: string,
    @Body() dto: WorkSpaceDto,
  ): Promise<UpdateWorkspaceResponseDto> {
    const response = await this.workspace.updateWorkspace(slug, dto);

    return {
      success: true,
      message: 'Workspace updated successfully',
      data: response,
    };
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete workspace',
  })
  @ApiWorkspaceSlugParam()
  @ApiSuccess('ok', 'Workspace deleted successfully', BaseResponseDto)
  @ApiNotFound('Workspace')
  @ApiProtectedErrors()
  @UseGuards(WorkspaceOwnerGuard)
  @Delete(':slug')
  async deleteWorkspace(@Param('slug') slug: string): Promise<BaseResponseDto> {
    await this.workspace.deleteWorkspace(slug);

    return {
      success: true,
      message: 'Workspace deleted successfully',
    };
  }
}
