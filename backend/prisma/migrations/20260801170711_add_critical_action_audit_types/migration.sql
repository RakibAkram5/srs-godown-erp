-- Extend AuditAction with critical business-action types so sales, purchases,
-- payments, user management, balance adjustments and settings changes get an
-- audit trail, not just auth events.
ALTER TYPE "AuditAction" ADD VALUE 'SALE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'SALE_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'PURCHASE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'PURCHASE_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'USER_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'USER_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'USER_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET';
ALTER TYPE "AuditAction" ADD VALUE 'BALANCE_ADJUSTMENT';
ALTER TYPE "AuditAction" ADD VALUE 'SETTINGS_UPDATE';
