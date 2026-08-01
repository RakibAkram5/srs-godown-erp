-- Forgot-password OTP flow: new audit action types + a table for short-lived,
-- single-use, hashed OTPs.
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_OTP_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_OTP_COMPLETED';

CREATE TABLE "password_reset_otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "password_reset_otps_user_id_idx" ON "password_reset_otps"("user_id");

ALTER TABLE "password_reset_otps" ADD CONSTRAINT "password_reset_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
