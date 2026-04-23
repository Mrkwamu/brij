import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkSpaceDto } from './dto';
@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * This file is sole purpose is to create a workspace for users
   */
  async createWorkspace(userId: string, dto: WorkSpaceDto) {
    if (!userId) throw new BadRequestException('UserId is missing');
    if (!dto.name || dto.name.trim() === '')
      throw new BadRequestException('Workspace name is missing');

    try {
      const isExisting = await this.prisma.workspace.findFirst({
        where: {
          name: dto.name.trim().toLowerCase(),
          userId: userId,
        },
      });

      if (isExisting)
        throw new ConflictException('workspace name already in use');

      const response = await this.prisma.workspace.create({
        data: {
          userId: userId,
          name: dto.name.trim().toLowerCase(),
        },
        select: {
          name: true,
          createdAt: true,
        },
      });

      return response;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create workspace');
    }
  }
}
