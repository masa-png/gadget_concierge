import { RAKUTEN_API_CONFIG } from "@/lib/config/cron";

// 楽天API商品アイテムの型定義
export interface RakutenItem {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  itemCode: string;
  genreId: string;
  itemCaption?: string;
  catchcopy?: string;
  reviewCount?: number;
  reviewAverage?: number;
  mediumImageUrls?: string[];
  smallImageUrls?: string[];
  shopName: string;
  shopCode: string;
  affiliateUrl?: string;
  shopAffiliateUrl?: string;
  affiliateRate?: number;
  availability: number;
  taxFlag?: number;
  postageFlag?: number;
  creditCardFlag?: number;
  imageFlag?: number;
  pointRate?: number;
}

export interface RakutenApiResponse {
  items: RakutenItem[];
  count?: number;
  page?: number;
  first?: number;
  last?: number;
  hits?: number;
  carrier?: number;
  pageCount?: number;
}

// レート制限管理
let lastRakutenRequestTime = 0;

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
export async function fetchRakutenProducts(
  categoryId: string,
  page: number = 1
): Promise<RakutenApiResponse> {
  if (!RAKUTEN_API_CONFIG.APP_ID) {
    throw new Error("Rakuten App ID is not configured");
  }

  await waitForRateLimit();

  const baseParams = new URLSearchParams({
    applicationId: RAKUTEN_API_CONFIG.APP_ID,
    format: "json",
    formatVersion: "2",
    genreId: categoryId,
    page: String(page),
    hits: "30",
    availability: "1",
    imageFlag: "1",
  });

  if (RAKUTEN_API_CONFIG.AFFILIATE_ID) {
    baseParams.append("affiliateId", RAKUTEN_API_CONFIG.AFFILIATE_ID);
  }

  // sortパラメータを手動でUTF-8エンコード
  const sortParam = `sort=${encodeURIComponent("-reviewCount")}`;

  const url = `${RAKUTEN_API_CONFIG.BASE_URL}/IchibaItem/Search/${
    RAKUTEN_API_CONFIG.VERSION
  }?${baseParams.toString()}&${sortParam}`;

  console.log(url);
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
