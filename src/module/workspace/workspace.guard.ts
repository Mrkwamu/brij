import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppRequest } from '../../decorators/user.decorator';

@Injectable()
export class WorkspaceOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();

    const slug = Array.isArray(request.params.slug)
      ? request.params.slug[0]
      : request.params.slug;
    const userId = request.user.userId;

    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true, userId: true, slug: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.userId !== userId) {
      throw new ForbiddenException('You do not own this workspace');
    }

    request.workspace = workspace;

    return true;
  }
}
