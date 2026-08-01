import { Request } from 'express';
import { AuditAction } from '@prisma/client';
import { auditLogRepository } from '@/repositories/auditLog.repository';
import { logger } from '@/utils/logger';

/**
 * Records a critical-action audit entry. Never throws — a logging failure
 * must not roll back or fail the business operation it's describing.
 */
export function logAudit(req: Request, action: AuditAction, detail: string) {
  auditLogRepository
    .create({ userId: req.user?.sub, action, detail, ipAddress: req.ip })
    .catch((err) => logger.warn(`Failed to write audit log for ${action}`, err));
}
