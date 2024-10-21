import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { UserRole } from '../user/user.interfaces';
import { AuthUser, MediaAccessUser } from './auth.interfaces';

export const User = createParamDecorator(
  (data, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest();
    return {
      role: req.user.role,
      id: req.user.id,
      jwtId: req.user.jti,
    };
  },
);

export const MediaUser = createParamDecorator(
  (data, ctx: ExecutionContext): MediaAccessUser => {
    const req = ctx.switchToHttp().getRequest();
    return {
      projectId: req.user.projectId,
    };
  },
);

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
