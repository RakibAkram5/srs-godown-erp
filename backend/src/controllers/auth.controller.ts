import { Request, Response } from 'express';
import { authService, RequestContext } from '@/services/auth.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';

function contextOf(req: Request): RequestContext {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, contextOf(req));
    return sendSuccess(res, result, 'Logged in successfully');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    return sendSuccess(res, result, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.logout(req.user.sub, req.body?.refreshToken, contextOf(req));
    return sendSuccess(res, null, 'Logged out successfully');
  }),

  // Alias kept for backward compatibility with earlier clients.
  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.getProfile(req.user.sub);
    return sendSuccess(res, user);
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.getProfile(req.user.sub);
    return sendSuccess(res, user);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.updateProfile(req.user.sub, req.body, contextOf(req));
    return sendSuccess(res, user, 'Profile updated');
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.changePassword(req.user.sub, req.body, contextOf(req));
    return sendSuccess(res, null, 'Password changed successfully');
  }),

  loginHistory: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const history = await authService.listLoginHistory(req.user.sub);
    return sendSuccess(res, history);
  }),

  auditLog: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const logs = await authService.listAuditLog(req.user.sub);
    return sendSuccess(res, logs);
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body, contextOf(req));
    // Same response whether or not the username exists — avoids leaking valid accounts.
    return sendSuccess(res, null, 'If that account exists, a reset code has been emailed to it.');
  }),

  resetPasswordWithOtp: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPasswordWithOtp(req.body, contextOf(req));
    return sendSuccess(res, null, 'Password reset successfully. You can now sign in.');
  }),
};
