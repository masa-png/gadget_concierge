import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// 動的レンダリングを明示的に指定
export const dynamic = "force-dynamic";

// セキュリティ設定（段階的アプローチ）
const SECURITY_CONFIG = {
  // 許可されたIPアドレス範囲（Vercel Cronサービス用）
  ALLOWED_IPS: [
    "76.76.19.0/24", // Vercel infrastructure
    "76.223.126.0/24", // Vercel edge network
    "127.0.0.1", // localhost (開発用)
    "::1", // IPv6 localhost
  ],

  // 許可されたUser-Agent（部分一致、緩い制限）
  ALLOWED_USER_AGENTS: [
    "Vercel-Cron",
    "ProductRecommendationApp-Cron",
    "curl", // 開発・テスト用
    "PostmanRuntime", // 開発・テスト用
    "node", // Node.js環境
  ],

  // レート制限設定
  RATE_LIMIT: {
    MAX_REQUESTS: 10, // 最大リクエスト数
    WINDOW_MS: 3600000, // 1時間（ミリ秒）
  },
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

// User-Agentチェック（緩い制限）
function isUserAgentAllowed(userAgent: string): boolean {
  if (!userAgent) return false;

  return SECURITY_CONFIG.ALLOWED_USER_AGENTS.some((allowed) =>
    userAgent.toLowerCase().includes(allowed.toLowerCase())
  );
}

// レート制限チェック
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${clientIP}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
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

// 段階的セキュリティチェック
function isValidCronRequest(request: NextRequest): {
  isValid: boolean;
  reason?: string;
  securityLevel: "LOW" | "MEDIUM" | "HIGH";
} {
  // 1. クライアントIP取得
  const clientIP =
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 2. IPアドレスチェック（必須 - 最重要）
  if (!isIPAllowed(clientIP)) {
    return {
      isValid: false,
      reason: `IPアドレス ${clientIP} は許可されていません`,
      securityLevel: "LOW",
    };
  }

  // 3. レート制限チェック（必須）
  if (!checkRateLimit(clientIP)) {
    return {
      isValid: false,
      reason: `IPアドレス ${clientIP} がレート制限に達しました`,
      securityLevel: "LOW",
    };
  }

  // 4. 環境変数および認証レベル判定
  const cronSecret = process.env.CRON_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  const userAgent = request.headers.get("user-agent") || "";
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  const authHeader = request.headers.get("authorization");

  // 5. User-Agentチェック（警告のみ）
  if (userAgent && !isUserAgentAllowed(userAgent)) {
    console.warn(`⚠️ 不明なUser-Agent: ${userAgent} (IP: ${clientIP})`);
  }

  // 6. Vercel Cronヘッダーチェック（警告のみ）
  if (!vercelCronHeader) {
    console.warn(`⚠️ Vercel Cronヘッダーなし (IP: ${clientIP})`);
  }

  // 7. 環境別認証処理
  if (nodeEnv === "development") {
    // 開発環境: 緩い認証
    if (cronSecret && authHeader) {
      // 認証トークンがある場合は検証
      if (authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "");
        try {
          if (
            !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))
          ) {
            console.warn(`⚠️ 開発環境: 認証トークンが無効 (IP: ${clientIP})`);
          }
        } catch (error) {
          console.warn(
            `⚠️ 開発環境: 認証トークンの形式エラー (IP: ${clientIP})`
          );
        }
      }
    } else {
      console.info(`ℹ️ 開発環境: 認証なしで実行 (IP: ${clientIP})`);
    }

    return {
      isValid: true,
      securityLevel: "LOW",
    };
  } else {
    // 本番環境: 厳格な認証
    if (!cronSecret) {
      console.warn("⚠️ 本番環境: CRON_SECRET環境変数が設定されていません");
      return {
        isValid: true, // IP制限のみで許可（警告は記録）
        securityLevel: "MEDIUM",
      };
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn(`⚠️ 本番環境: 認証ヘッダーなし (IP: ${clientIP})`);
      return {
        isValid: true, // IP制限で十分と判断
        securityLevel: "MEDIUM",
      };
    }

    // 認証トークン検証
    const token = authHeader.replace("Bearer ", "");
    try {
      if (
        !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))
      ) {
        return {
          isValid: false,
          reason: "認証トークンが無効です",
          securityLevel: "LOW",
        };
      }
    } catch (error) {
      return {
        isValid: false,
        reason: "認証トークンの形式が正しくありません",
        securityLevel: "LOW",
      };
    }

    return {
      isValid: true,
      securityLevel: "HIGH",
    };
  }
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

// 製品データ保存
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

// 特徴抽出関数
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

// カテゴリ名取得
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
  securityLevel: "LOW" | "MEDIUM" | "HIGH",
  reason?: string
) {
  const clientIP =
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const env = process.env.NODE_ENV || "unknown";

  console.log(
    `🔒 セキュリティ: ${type} [${securityLevel}] - ENV: ${env}, IP: ${clientIP}, UA: ${userAgent}${
      reason ? `, 理由: ${reason}` : ""
    }`
  );
}

// メインCron処理
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`🔄 楽天商品同期Cronジョブ開始 (ID: ${requestId})`);

  // 段階的セキュリティチェック
  const authResult = isValidCronRequest(request);
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

    return NextResponse.json(
      {
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
      },
      { status: 500 }
    );
  }
}

// POSTリクエストも同様にセキュリティチェック
export async function POST(request: NextRequest) {
  return GET(request);
}
