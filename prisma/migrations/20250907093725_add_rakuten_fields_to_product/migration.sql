-- CreateEnum
CREATE TYPE "inquiry_status" AS ENUM ('UNREAD', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "inquiry_priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "affiliate_rate" DECIMAL(4,2),
ADD COLUMN     "affiliate_url" TEXT,
ADD COLUMN     "availability" INTEGER DEFAULT 1,
ADD COLUMN     "catch_copy" TEXT,
ADD COLUMN     "credit_card_flag" INTEGER DEFAULT 1,
ADD COLUMN     "image_flag" INTEGER DEFAULT 1,
ADD COLUMN     "item_caption" TEXT,
ADD COLUMN     "last_synced_at" TIMESTAMPTZ(6),
ADD COLUMN     "medium_image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "point_rate" INTEGER DEFAULT 1,
ADD COLUMN     "point_rate_end_time" TIMESTAMPTZ(6),
ADD COLUMN     "point_rate_start_time" TIMESTAMPTZ(6),
ADD COLUMN     "postage_flag" INTEGER DEFAULT 1,
ADD COLUMN     "rakuten_genre_id" TEXT,
ADD COLUMN     "rakuten_item_code" TEXT,
ADD COLUMN     "review_average" DECIMAL(3,2),
ADD COLUMN     "review_count" INTEGER DEFAULT 0,
ADD COLUMN     "shop_affiliate_url" TEXT,
ADD COLUMN     "shop_code" TEXT,
ADD COLUMN     "shop_name" TEXT,
ADD COLUMN     "shop_url" TEXT,
ADD COLUMN     "small_image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tax_flag" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "avatar_image_key" TEXT;

-- CreateTable
CREATE TABLE "contact_inquiries" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "inquiry_status" NOT NULL DEFAULT 'UNREAD',
    "priority" "inquiry_priority" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignee_id" TEXT,
    "notes" TEXT,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "contact_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_inquiries_status_idx" ON "contact_inquiries"("status");

-- CreateIndex
CREATE INDEX "contact_inquiries_priority_idx" ON "contact_inquiries"("priority");

-- CreateIndex
CREATE INDEX "contact_inquiries_created_at_idx" ON "contact_inquiries"("created_at");

-- CreateIndex
CREATE INDEX "contact_inquiries_email_idx" ON "contact_inquiries"("email");

-- CreateIndex
CREATE INDEX "products_rakuten_genre_id_idx" ON "products"("rakuten_genre_id");

-- CreateIndex
CREATE INDEX "products_shop_code_idx" ON "products"("shop_code");

-- CreateIndex
CREATE INDEX "products_availability_idx" ON "products"("availability");

-- CreateIndex
CREATE INDEX "products_price_idx" ON "products"("price");

-- CreateIndex
CREATE INDEX "products_rating_idx" ON "products"("rating");

-- CreateIndex
CREATE INDEX "products_review_count_idx" ON "products"("review_count");

-- CreateIndex
CREATE INDEX "products_affiliate_rate_idx" ON "products"("affiliate_rate");

-- CreateIndex
CREATE INDEX "products_last_synced_at_idx" ON "products"("last_synced_at");
