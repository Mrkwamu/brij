import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WorkSpaceDto } from './dto';

import { User } from '../../decorators/user.decorator';
import { JwtPayload } from '../auth/types/auth.types';
import { WorkspaceService } from './workspace.service';
import { Public } from '../../decorators/public.decorator';
import { ApikeyGuard } from './api-key/apiKey-guard';

@Controller('/api/workspace')
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}
  @Post('create')
  async createWorkspace(@Body() dto: WorkSpaceDto, @User() user: JwtPayload) {
    const userId = user.userId;

    const response = await this.workspace.createWorkspace(userId, dto);

    return {
      message: 'Workspace created successfully',
      response,
    };
  }
  @Public()
  @UseGuards(ApikeyGuard)
  @Post('check')
  check() {
    return {
      message: 'sucessfully guarded lol',
    };
  }
}
