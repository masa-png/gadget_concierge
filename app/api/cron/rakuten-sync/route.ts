import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// 動的レンダリングを明示的に指定
export const dynamic = "force-dynamic";

// セキュリティ設定
const SECURITY_CONFIG = {
  // 許可されたIPアドレス範囲（Vercel Cronサービス用）
  ALLOWED_IPS: [
    "76.76.19.0/24", // Vercel infrastructure
    "76.223.126.0/24", // Vercel edge network
    "127.0.0.1", // localhost (開発用)
    "::1", // IPv6 localhost
  ],

  // 許可されたUser-Agent
  ALLOWED_USER_AGENTS: ["Vercel-Cron/1.0", "ProductRecommendationApp-Cron/1.0"],

  // レート制限設定
  RATE_LIMIT: {
    MAX_REQUESTS: 5, // 最大リクエスト数
    WINDOW_MS: 3600000, // 1時間（ミリ秒）
  },

  // 必要なヘッダー
  REQUIRED_HEADERS: [
    "x-vercel-cron", // Vercel Cron特有のヘッダー
    "authorization", // 認証トークン
  ],
};

// Rakuten API設定
const RAKUTEN_API_CONFIG = {
  BASE_URL: "https://app.rakuten.co.jp/services/api",
  APP_ID: process.env.RAKUTEN_APP_ID,
  AFFILIATE_ID: process.env.RAKUTEN_AFFILIATE_ID,
  VERSION: "20220601",
  CATEGORIES: {
    COMPUTER: "565162",
    PC_PARTS: "100087",
    DISPLAY: "110105",
    INPUT_DEVICE: "303087",
    GAMING: "567167",
    SMARTPHONE: "560202",
    TABLET: "560029",
    SMARTWATCH: "564895",
    BATTERY: "509433",
    AUDIO: "408507",
  },
};

// レート制限管理（メモリベース）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
let lastRakutenRequestTime = 0;

// IPアドレス範囲チェック用ヘルパー
function isIPInRange(ip: string, cidr: string): boolean {
  try {
    if (ip === "127.0.0.1" || ip === "::1") return true;

    const [range, prefixLength] = cidr.split("/");
    const prefixLengthNum = parseInt(prefixLength, 10);

    // IPv4の場合
    if (range.includes(".")) {
      const ipNum = ipToNumber(ip);
      const rangeNum = ipToNumber(range);
      const mask = (0xffffffff << (32 - prefixLengthNum)) >>> 0;

      return (ipNum & mask) === (rangeNum & mask);
    }

    return false;
  } catch {
    return false;
  }
}

function ipToNumber(ip: string): number {
  return (
    ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  );
}

// IP許可リストチェック
function isIPAllowed(ip: string): boolean {
  if (!ip) return false;

  return SECURITY_CONFIG.ALLOWED_IPS.some((allowedIP) =>
    isIPInRange(ip, allowedIP)
  );
}

// User-Agentチェック
function isUserAgentAllowed(userAgent: string): boolean {
  if (!userAgent) return false;

  return SECURITY_CONFIG.ALLOWED_USER_AGENTS.some((allowed) =>
    userAgent.includes(allowed)
  );
}

// レート制限チェック
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${clientIP}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // 新しいウィンドウを開始
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
    });
    return true;
  }

  if (record.count >= SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }

  record.count++;
  rateLimitStore.set(key, record);
  return true;
}

// セキュアなCron認証
function isValidCronRequest(request: NextRequest): {
  isValid: boolean;
  reason?: string;
} {
  // 1. 環境変数チェック
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return {
      isValid: false,
      reason: "CRON_SECRET環境変数が設定されていません",
    };
  }

  // 2. 必要なヘッダーの存在確認
  for (const header of SECURITY_CONFIG.REQUIRED_HEADERS) {
    if (!request.headers.get(header)) {
      return {
        isValid: false,
        reason: `必要なヘッダー ${header} が不足しています`,
      };
    }
  }

  // 3. 認証トークンチェック
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      isValid: false,
      reason: "認証ヘッダーの形式が正しくありません",
    };
  }

  const token = authHeader.replace("Bearer ", "");
  if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))) {
    return {
      isValid: false,
      reason: "認証トークンが無効です",
    };
  }

  // 4. IPアドレスチェック
  const clientIP =
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!isIPAllowed(clientIP)) {
    return {
      isValid: false,
      reason: `IPアドレス ${clientIP} は許可されていません`,
    };
  }

  // 5. User-Agentチェック
  const userAgent = request.headers.get("user-agent") || "";
  if (!isUserAgentAllowed(userAgent)) {
    return {
      isValid: false,
      reason: `User-Agent ${userAgent} は許可されていません`,
    };
  }

  // 6. レート制限チェック
  if (!checkRateLimit(clientIP)) {
    return {
      isValid: false,
      reason: `IPアドレス ${clientIP} がレート制限に達しました`,
    };
  }

  // 7. Vercel Cronヘッダーチェック
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  if (!vercelCronHeader) {
    return {
      isValid: false,
      reason: "Vercel Cronヘッダーが不足しています",
    };
  }

  return { isValid: true };
}

// 楽天APIレート制限待機
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRakutenRequestTime;
  const minimumInterval = 1000; // 1秒間隔

  if (timeSinceLastRequest < minimumInterval) {
    const waitTime = minimumInterval - timeSinceLastRequest;
    console.log(`楽天APIレート制限: ${waitTime}ms 待機中...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRakutenRequestTime = Date.now();
}

// Rakuten API商品取得
async function fetchRakutenProducts(categoryId: string, page: number = 1) {
  if (!RAKUTEN_API_CONFIG.APP_ID) {
    throw new Error("Rakuten App ID is not configured");
  }

  await waitForRateLimit();

  const searchParams = new URLSearchParams({
    applicationId: RAKUTEN_API_CONFIG.APP_ID,
    format: "json",
    formatVersion: "2",
    genreId: categoryId,
    page: String(page),
    hits: "30",
    sort: "-reviewCount",
    availability: "1",
    imageFlag: "1",
  });

  if (RAKUTEN_API_CONFIG.AFFILIATE_ID) {
    searchParams.append("affiliateId", RAKUTEN_API_CONFIG.AFFILIATE_ID);
  }

  const url = `${RAKUTEN_API_CONFIG.BASE_URL}/IchibaItem/Search/${
    RAKUTEN_API_CONFIG.VERSION
  }?${searchParams.toString()}`;

  console.log(`Cron: 楽天API呼び出し - カテゴリ:${categoryId}, ページ:${page}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "ProductRecommendationApp-Cron/1.0",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (response.status === 429) {
    console.warn("楽天APIレート制限エラー - 2秒待機");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    throw new Error("Rate limit exceeded");
  }

  if (!response.ok) {
    throw new Error(`Rakuten API request failed: ${response.status}`);
  }

  return await response.json();
}

// 製品データ保存（既存の実装を維持）
async function saveProductToDatabase(item: any, categoryId: string) {
  const existingProduct = await prisma.product.findFirst({
    where: { rakuten_url: item.itemUrl },
  });

  if (existingProduct) {
    return await prisma.product.update({
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
  }

  let description = item.itemCaption || item.itemName;
  if (item.catchcopy && item.catchcopy !== description) {
    description = `${item.catchcopy}\n${description}`;
  }

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

  const category = await prisma.category.findFirst({
    where: { name: getCategoryName(categoryId) },
  });

  if (category) {
    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId: savedProduct.id,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        productId: savedProduct.id,
        categoryId: category.id,
      },
    });
  }

  return savedProduct;
}

// 特徴抽出関数（既存の実装を維持）
function extractFeatures(description: string, name: string): string {
  if (!description) return name;

  const featureKeywords = [
    "GB",
    "インチ",
    "カメラ",
    "バッテリー",
    "防水",
    "5G",
    "SIM",
    "CPU",
    "メモリ",
    "SSD",
    "HDD",
    "グラフィック",
    "Office",
    "Windows",
    "Mac",
    "万画素",
    "ズーム",
    "手ブレ",
    "4K",
    "動画",
    "レンズ",
    "新品",
    "正規品",
    "保証",
    "送料無料",
    "即日発送",
  ];

  const features = [];
  const words = description.split(/[・\s,、。\n]+/);

  for (const word of words) {
    const trimmedWord = word.trim();
    if (
      trimmedWord.length > 2 &&
      featureKeywords.some((keyword) => trimmedWord.includes(keyword))
    ) {
      features.push(trimmedWord);
    }
    if (features.length >= 6) break;
  }

  return features.length > 0 ? features.join("・") : name.substring(0, 100);
}

// カテゴリ名取得（既存の実装を維持）
function getCategoryName(categoryId: string): string {
  const categoryMap: { [key: string]: string } = {
    "565162": "パソコン",
    "100087": "PCパーツ",
    "110105": "ディスプレイ",
    "303087": "マウス・キーボード・入力機器",
    "567167": "ゲーム用機器",
    "560202": "スマートフォン本体",
    "560029": "タブレットPC本体",
    "564895": "スマートウォッチ本体",
    "509433": "バッテリー・充電器",
    "408507": "ヘッドセット・イヤホンマイク",
  };

  return categoryMap[categoryId] || "その他";
}

// セキュリティログ記録
function logSecurityEvent(
  type: "ALLOWED" | "DENIED",
  request: NextRequest,
  reason?: string
) {
  const clientIP =
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  console.log(
    `🔒 セキュリティ: ${type} - IP: ${clientIP}, UA: ${userAgent}${
      reason ? `, 理由: ${reason}` : ""
    }`
  );
}

// メインCron処理
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`🔄 楽天商品同期Cronジョブ開始 (ID: ${requestId})`);

  // セキュリティチェック
  const authResult = isValidCronRequest(request);
  if (!authResult.isValid) {
    logSecurityEvent("DENIED", request, authResult.reason);

    return NextResponse.json(
      {
        error: "Unauthorized cron request",
        reason: authResult.reason,
        requestId,
      },
      { status: 401 }
    );
  }

  logSecurityEvent("ALLOWED", request);

  const startTime = Date.now();
  let totalProcessed = 0;
  let totalSaved = 0;
  let totalUpdated = 0;
  const results: { [key: string]: any } = {};

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
            const existingProduct = await prisma.product.findFirst({
              where: { rakuten_url: item.itemUrl },
            });

            await saveProductToDatabase(item, categoryId);

            if (existingProduct) {
              categoryUpdated++;
            } else {
              categorySaved++;
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
    const summary = {
      success: true,
      requestId,
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

    return NextResponse.json(
      {
        success: false,
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${Math.round((Date.now() - startTime) / 1000)}秒`,
        totalProcessed,
        totalSaved,
        totalUpdated,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POSTリクエストも同様にセキュリティチェック
export async function POST(request: NextRequest) {
  return GET(request);
}
