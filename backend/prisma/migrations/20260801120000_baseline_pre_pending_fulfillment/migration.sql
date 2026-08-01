-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE_IN', 'PURCHASE_RETURN_OUT', 'SALE_OUT', 'SALE_RETURN_IN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('VENDOR_PAYMENT', 'DEALER_RECEIPT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK', 'CARD', 'CHEQUE', 'OTHER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'EMPLOYEE';

-- AlterTable
ALTER TABLE "settings" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "lastLogin",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profile_image" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "browser" TEXT,
    "device" TEXT,
    "os" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_at" TIMESTAMP(3),

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "detail" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "product_code" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "image" TEXT,
    "description" TEXT,
    "category_id" TEXT,
    "brand_id" TEXT,
    "unit_id" TEXT,
    "warehouse" TEXT,
    "rack" TEXT,
    "shelf" TEXT,
    "bikes" TEXT[],
    "purchase_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sale_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "opening_stock" INTEGER NOT NULL DEFAULT 0,
    "minimum_stock" INTEGER NOT NULL DEFAULT 0,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "opening_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "purchase_no" TEXT,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendor_id" TEXT NOT NULL,
    "warehouse" TEXT,
    "rack" TEXT,
    "shelf" TEXT,
    "sub_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previous_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchase_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "line_total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_returns" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "return_no" TEXT,
    "return_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchase_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_return_items" (
    "id" TEXT NOT NULL,
    "return_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "line_total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "purchase_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "reference_no" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "sale_no" TEXT,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "dealer_id" TEXT,
    "sub_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "previous_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pending_quantity" INTEGER NOT NULL DEFAULT 0,
    "sale_price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "line_total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_returns" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "return_no" TEXT,
    "return_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sale_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_return_items" (
    "id" TEXT NOT NULL,
    "return_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "line_total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "sale_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "opening_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "voucher_no" TEXT,
    "type" "PaymentType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "vendor_id" TEXT,
    "dealer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispatches" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "dispatch_no" TEXT,
    "sale_id" TEXT NOT NULL,
    "bilty_number" TEXT NOT NULL,
    "transporter_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "dispatch_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "expense_no" TEXT,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salaries" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "salary_no" TEXT,
    "employee_name" TEXT NOT NULL,
    "user_id" TEXT,
    "month" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_date" TIMESTAMP(3),
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjustments" (
    "id" TEXT NOT NULL,
    "code_no" SERIAL NOT NULL,
    "adjustment_no" TEXT,
    "dealer_id" TEXT,
    "vendor_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "login_history_user_id_idx" ON "login_history"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_no_key" ON "products"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_is_deleted_idx" ON "products"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_code_no_key" ON "purchases"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_purchase_no_key" ON "purchases"("purchase_no");

-- CreateIndex
CREATE INDEX "purchases_vendor_id_idx" ON "purchases"("vendor_id");

-- CreateIndex
CREATE INDEX "purchases_status_idx" ON "purchases"("status");

-- CreateIndex
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");

-- CreateIndex
CREATE INDEX "purchase_items_product_id_idx" ON "purchase_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_returns_code_no_key" ON "purchase_returns"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_returns_return_no_key" ON "purchase_returns"("return_no");

-- CreateIndex
CREATE INDEX "purchase_returns_purchase_id_idx" ON "purchase_returns"("purchase_id");

-- CreateIndex
CREATE INDEX "purchase_returns_vendor_id_idx" ON "purchase_returns"("vendor_id");

-- CreateIndex
CREATE INDEX "purchase_return_items_return_id_idx" ON "purchase_return_items"("return_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_code_no_key" ON "sales"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "sales_sale_no_key" ON "sales"("sale_no");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_dealer_id_idx" ON "sales"("dealer_id");

-- CreateIndex
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");

-- CreateIndex
CREATE INDEX "sale_items_product_id_idx" ON "sale_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_returns_code_no_key" ON "sale_returns"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "sale_returns_return_no_key" ON "sale_returns"("return_no");

-- CreateIndex
CREATE INDEX "sale_returns_sale_id_idx" ON "sale_returns"("sale_id");

-- CreateIndex
CREATE INDEX "sale_return_items_return_id_idx" ON "sale_return_items"("return_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_code_no_key" ON "payments"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "payments_voucher_no_key" ON "payments"("voucher_no");

-- CreateIndex
CREATE INDEX "payments_vendor_id_idx" ON "payments"("vendor_id");

-- CreateIndex
CREATE INDEX "payments_dealer_id_idx" ON "payments"("dealer_id");

-- CreateIndex
CREATE INDEX "payments_type_idx" ON "payments"("type");

-- CreateIndex
CREATE UNIQUE INDEX "dispatches_code_no_key" ON "dispatches"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "dispatches_dispatch_no_key" ON "dispatches"("dispatch_no");

-- CreateIndex
CREATE INDEX "dispatches_sale_id_idx" ON "dispatches"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_code_no_key" ON "expenses"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expense_no_key" ON "expenses"("expense_no");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE UNIQUE INDEX "salaries_code_no_key" ON "salaries"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "salaries_salary_no_key" ON "salaries"("salary_no");

-- CreateIndex
CREATE INDEX "salaries_user_id_idx" ON "salaries"("user_id");

-- CreateIndex
CREATE INDEX "salaries_month_idx" ON "salaries"("month");

-- CreateIndex
CREATE UNIQUE INDEX "adjustments_code_no_key" ON "adjustments"("code_no");

-- CreateIndex
CREATE UNIQUE INDEX "adjustments_adjustment_no_key" ON "adjustments"("adjustment_no");

-- CreateIndex
CREATE INDEX "adjustments_dealer_id_idx" ON "adjustments"("dealer_id");

-- CreateIndex
CREATE INDEX "adjustments_vendor_id_idx" ON "adjustments"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "purchase_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "sale_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaries" ADD CONSTRAINT "salaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

