-- Percentage-based discount entry, additive alongside the existing fixed
-- `discount` amount columns (which keep their current meaning for full
-- backward compatibility with historical invoices).
ALTER TABLE "sales" ADD COLUMN "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "sale_items" ADD COLUMN "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Bilty image attachments (base64 data-URLs, same convention as logo/profile/product images).
ALTER TABLE "dispatches" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
