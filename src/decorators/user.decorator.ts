import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../module/auth/types/auth.types';
import { Workspace } from '../module/workspace/type/workspace.type';

export interface AppRequest extends Request {
  user: JwtPayload;
  workspace: Workspace;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AppRequest>();
    return request.user;
  },
);
