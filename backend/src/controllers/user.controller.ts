import { Request, Response } from 'express';
import { AuditAction } from '@prisma/client';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { logAudit } from '@/utils/audit';
import { userService } from '@/services/user.service';

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, await userService.list());
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create(req.body);
    logAudit(req, AuditAction.USER_CREATE, `Created user ${user.username} (${user.role})`);
    return sendSuccess(res, user, 'User created', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id, req.body);
    logAudit(req, AuditAction.USER_UPDATE, `Updated user ${user.username}`);
    return sendSuccess(res, user, 'User updated');
  }),
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await userService.resetPassword(req.params.id, req.body.password);
    logAudit(req, AuditAction.PASSWORD_RESET, `Reset password for user ${req.params.id}`);
    return sendSuccess(res, null, 'Password reset');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await userService.remove(req.params.id, req.user!.sub);
    logAudit(req, AuditAction.USER_DELETE, `Deleted user ${req.params.id}`);
    return sendSuccess(res, null, 'User deleted');
  }),
};
