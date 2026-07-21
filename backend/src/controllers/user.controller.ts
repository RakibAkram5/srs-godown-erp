import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { userService } from '@/services/user.service';

export const userController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, await userService.list());
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await userService.create(req.body), 'User created', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await userService.update(req.params.id, req.body), 'User updated');
  }),
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await userService.resetPassword(req.params.id, req.body.password);
    return sendSuccess(res, null, 'Password reset');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await userService.remove(req.params.id, req.user!.sub);
    return sendSuccess(res, null, 'User deleted');
  }),
};
