import { Request, Response } from 'express';
import { prisma } from '@/config/prisma';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';

export const healthController = {
  check: asyncHandler(async (_req: Request, res: Response) => {
    let database = 'up';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    return sendSuccess(res, {
      status: 'ok',
      database,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }),
};
