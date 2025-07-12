/*
  Warnings:

  - You are about to drop the column `amazon_url` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "amazon_url",
ADD COLUMN     "rakuten_url" TEXT;
