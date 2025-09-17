import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { RAKUTEN_API_CONFIG } from "@/lib/config/cron";
import { validateCronRequest, logSecurityEvent } from "@/lib/services/cron-security";
import { fetchRakutenProducts } from "@/lib/services/rakuten-api";
import { saveProductToDatabase } from "@/lib/services/products";

// 動的レンダリングを明示的に指定
export const dynamic = "force-dynamic";

// 処理結果の型定義
interface CategoryResult {
  processed?: number;
  saved?: number;
  updated?: number;
  totalItems?: number;
  error?: string;
}

interface CronSummary {
  success: boolean;
  requestId: string;
  securityLevel: "LOW" | "MEDIUM" | "HIGH";
  environment: string;
  duration: string;
  totalProcessed: number;
  totalSaved: number;
  totalUpdated: number;
  timestamp: string;
  results: Record<string, CategoryResult>;
  error?: string;
}

// メインCron処理
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`🔄 楽天商品同期Cronジョブ開始 (ID: ${requestId})`);

  // 段階的セキュリティチェック
  const authResult = validateCronRequest(request);
  if (!authResult.isValid) {
    logSecurityEvent(
      "DENIED",
      request,
      authResult.securityLevel,
      authResult.reason
    );

    return NextResponse.json(
      {
        error: "Unauthorized cron request",
        reason: authResult.reason,
        requestId,
        securityLevel: authResult.securityLevel,
      },
      { status: 401 }
    );
  }

  logSecurityEvent("ALLOWED", request, authResult.securityLevel);

  const startTime = Date.now();
  let totalProcessed = 0;
  let totalSaved = 0;
  let totalUpdated = 0;
  const results: Record<string, CategoryResult> = {};

  try {
    // 全カテゴリを順次処理
    for (const [categoryKey, categoryId] of Object.entries(
      RAKUTEN_API_CONFIG.CATEGORIES
    )) {
      console.log(`📱 ${categoryKey} (${categoryId}) 処理開始`);

      try {
        const apiResponse = await fetchRakutenProducts(categoryId, 1);

        if (!apiResponse.items || apiResponse.items.length === 0) {
          console.log(`⚠️  ${categoryKey}: 商品が見つかりませんでした`);
          results[categoryKey] = { processed: 0, saved: 0, updated: 0 };
          continue;
        }

        let categoryProcessed = 0;
        let categorySaved = 0;
        let categoryUpdated = 0;

        for (const item of apiResponse.items) {
          try {
            const result = await saveProductToDatabase(item, categoryId);

            if (result.isNew) {
              categorySaved++;
            } else {
              categoryUpdated++;
            }

            categoryProcessed++;
          } catch (error) {
            console.error(`商品保存エラー: ${item.itemName}`, error);
          }
        }

        results[categoryKey] = {
          processed: categoryProcessed,
          saved: categorySaved,
          updated: categoryUpdated,
          totalItems: apiResponse.count || 0,
        };

        totalProcessed += categoryProcessed;
        totalSaved += categorySaved;
        totalUpdated += categoryUpdated;

        console.log(
          `✅ ${categoryKey}: 処理${categoryProcessed}件 (新規${categorySaved}件, 更新${categoryUpdated}件)`
        );
      } catch (error) {
        console.error(`❌ ${categoryKey} 処理エラー:`, error);
        results[categoryKey] = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    const duration = Date.now() - startTime;
    const summary: CronSummary = {
      success: true,
      requestId,
      securityLevel: authResult.securityLevel,
      environment: process.env.NODE_ENV || "unknown",
      duration: `${Math.round(duration / 1000)}秒`,
      totalProcessed,
      totalSaved,
      totalUpdated,
      timestamp: new Date().toISOString(),
      results,
    };

    console.log(
      `🎉 Cron処理完了 (ID: ${requestId}): ${summary.duration}, 処理${totalProcessed}件`
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error(`❌ Cron処理エラー (ID: ${requestId}):`, error);

    const errorSummary: CronSummary = {
      success: false,
      requestId,
      securityLevel: authResult.securityLevel,
      environment: process.env.NODE_ENV || "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
      duration: `${Math.round((Date.now() - startTime) / 1000)}秒`,
      totalProcessed,
      totalSaved,
      totalUpdated,
      timestamp: new Date().toISOString(),
      results,
    };

    return NextResponse.json(errorSummary, { status: 500 });
  }
}

// POSTリクエストも同様にセキュリティチェック
export async function POST(request: NextRequest) {
  return GET(request);
}
