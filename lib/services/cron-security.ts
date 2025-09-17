import { NextRequest } from "next/server";
import crypto from "crypto";
import { SECURITY_CONFIG } from "@/lib/config/cron";

// 認証結果の型定義
export interface AuthResult {
  isValid: boolean;
  reason?: string;
  securityLevel: "LOW" | "MEDIUM" | "HIGH";
}

// レート制限管理（メモリベース）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

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

// クライアントIP取得
function getClientIP(request: NextRequest): string {
  return (
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// 段階的セキュリティチェック
export function validateCronRequest(request: NextRequest): AuthResult {
  const clientIP = getClientIP(request);

  // 1. IPアドレスチェック（必須 - 最重要）
  if (!isIPAllowed(clientIP)) {
    return {
      isValid: false,
      reason: `IPアドレス ${clientIP} は許可されていません`,
      securityLevel: "LOW",
    };
  }

  // 2. レート制限チェック（必須）
  if (!checkRateLimit(clientIP)) {
    return {
      isValid: false,
      reason: `IPアドレス ${clientIP} がレート制限に達しました`,
      securityLevel: "LOW",
    };
  }

  // 3. 環境変数および認証レベル判定
  const cronSecret = process.env.CRON_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  const userAgent = request.headers.get("user-agent") || "";
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  const authHeader = request.headers.get("authorization");

  // 4. User-Agentチェック（警告のみ）
  if (userAgent && !isUserAgentAllowed(userAgent)) {
    console.warn(`⚠️ 不明なUser-Agent: ${userAgent} (IP: ${clientIP})`);
  }

  // 5. Vercel Cronヘッダーチェック（警告のみ）
  if (!vercelCronHeader) {
    console.warn(`⚠️ Vercel Cronヘッダーなし (IP: ${clientIP})`);
  }

  // 6. 環境別認証処理
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
        } catch {
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
    } catch {
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

// セキュリティログ記録
export function logSecurityEvent(
  type: "ALLOWED" | "DENIED",
  request: NextRequest,
  securityLevel: "LOW" | "MEDIUM" | "HIGH",
  reason?: string
) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";
  const env = process.env.NODE_ENV || "unknown";

  console.log(
    `🔒 セキュリティ: ${type} [${securityLevel}] - ENV: ${env}, IP: ${clientIP}, UA: ${userAgent}${
      reason ? `, 理由: ${reason}` : ""
    }`
  );
}