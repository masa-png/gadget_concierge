import { prisma } from "@/lib/prisma";
import { RakutenItem } from "./rakuten-api";
import { extractFeatures, getCategoryName, buildProductDescription } from "@/lib/utils/product-utils";

import type { Product } from "@prisma/client";

// 製品保存結果の型定義
export interface ProductSaveResult {
  product: Product;
  isNew: boolean;
}

// 製品データ保存
export async function saveProductToDatabase(
  item: RakutenItem,
  categoryId: string
): Promise<ProductSaveResult> {
  const existingProduct = await prisma.product.findFirst({
    where: { rakuten_url: item.itemUrl },
  });

  if (existingProduct) {
    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        price: Math.round(item.itemPrice),
        availability: item.availability,
        review_count: item.reviewCount || 0,
        review_average: item.reviewAverage || 0,
        rating: item.reviewAverage || 0,
        last_synced_at: new Date(),
      },
    });

    return {
      product: updatedProduct,
      isNew: false,
    };
  }

  const description = buildProductDescription(
    item.itemCaption,
    item.itemName,
    item.catchcopy
  );

  const features = extractFeatures(item.itemCaption || "", item.itemName);

  const savedProduct = await prisma.product.create({
    data: {
      name: item.itemName.substring(0, 255),
      description: description.substring(0, 1000),
      price: Math.round(item.itemPrice),
      rating: item.reviewAverage || 0,
      features: features.substring(0, 500),
      rakuten_url: item.itemUrl,
      rakuten_item_code: item.itemCode,
      rakuten_genre_id: item.genreId,
      image_url: item.mediumImageUrls?.[0] || item.smallImageUrls?.[0] || "",
      small_image_urls: item.smallImageUrls || [],
      medium_image_urls: item.mediumImageUrls || [],
      review_count: item.reviewCount || 0,
      review_average: item.reviewAverage || 0,
      shop_name: item.shopName,
      shop_code: item.shopCode,
      shop_url: `https://www.rakuten.ne.jp/gold/${item.shopCode}/`,
      affiliate_url: item.affiliateUrl,
      shop_affiliate_url: item.shopAffiliateUrl,
      affiliate_rate: item.affiliateRate || 0,
      availability: item.availability,
      tax_flag: item.taxFlag,
      postage_flag: item.postageFlag,
      credit_card_flag: item.creditCardFlag,
      image_flag: item.imageFlag,
      point_rate: item.pointRate || 1,
      catch_copy: item.catchcopy,
      item_caption: item.itemCaption,
      last_synced_at: new Date(),
    },
  });

  await linkProductToCategory(savedProduct.id, categoryId);

  return {
    product: savedProduct,
    isNew: true,
  };
}

// 製品とカテゴリの関連付け
async function linkProductToCategory(productId: string, categoryId: string): Promise<void> {
  const category = await prisma.category.findFirst({
    where: { name: getCategoryName(categoryId) },
  });

  if (category) {
    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: productId,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        productId: productId,
        categoryId: category.id,
      },
    });
  }
}

// 既存製品チェック
export async function findExistingProduct(itemUrl: string) {
  return await prisma.product.findFirst({
    where: { rakuten_url: itemUrl },
  });
}