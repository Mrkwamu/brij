import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../common/utils/string.utils';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  GetAllWorkspaceResponse,
  WorkspaceResponse,
} from './type/workspace.type';
import { WorkSpaceDto } from './type/dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * This file is sole purpose is to create a workspace for users
   */
  async createWorkspace(
    userId: string,
    dto: WorkSpaceDto,
  ): Promise<WorkspaceResponse> {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Workspace name is missing');

    const baseSlug = dto.slug?.trim() || name;

    const slug = slugify(baseSlug);
    if (!slug)
      throw new BadRequestException(
        'Workspace name contains no valid characters',
      );

    try {
      const response = await this.prisma.workspace.create({
        data: {
          userId,
          name,
          slug,
        },
        select: {
          name: true,
          slug: true,
          createdAt: true,
        },
      });

      return response;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A workspace with this slug already exists.',
          );
        }
      }

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException('Failed to create workspace');
    }
  }

  async getWorkspaces(
    userId: string,
    limit?: number,
  ): Promise<GetAllWorkspaceResponse[]> {
    try {
      const result = await this.prisma.workspace.findMany({
        where: {
          userId,
          isDeleted: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to load workspace');
    }
  }

  async getWorkspace(workspaceId: string) {
    try {
      const workspace = await this.prisma.workspace.findFirst({
        where: { id: workspaceId, isDeleted: false },
        select: {
          id: true,
          name: true,
          apiKeys: {
            select: {
              keyName: true,
            },
          },
        },
      });

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      return workspace;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to load workspace');
    }
  }

  async updateWorkspace(slug: string, dto: WorkSpaceDto) {
    const name = dto.name.trim();

    if (!name) throw new BadRequestException('Workspace name is required');

    try {
      return await this.prisma.workspace.update({
        where: { slug },
        data: {
          name,
        },
        select: {
          name: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Workspace not found');
        }
      }

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update workspace');
    }
  }

  async deleteWorkspace(workspaceId: string) {
    try {
      const deleted = await this.prisma.workspace.updateMany({
        where: { id: workspaceId, isDeleted: false },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      if (deleted.count === 0) {
        throw new NotFoundException('Workspace not found or already deleted');
      }

      return deleted;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to delete workspace');
    }
  }
}
