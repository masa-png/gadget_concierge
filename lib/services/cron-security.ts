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

// レート制限チェック
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = `rate_limit_${identifier}`;
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

// クライアント識別子取得（IPまたはユーザーエージェント）
function getClientIdentifier(request: NextRequest): string {
  const ip =
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  // IPとUser-Agentの組み合わせで一意の識別子を生成
  return `${ip}_${userAgent.slice(0, 50)}`;
}

// セキュアな認証チェック
export function validateCronRequest(request: NextRequest): AuthResult {
  const clientIdentifier = getClientIdentifier(request);

  // 1. レート制限チェック
  if (!checkRateLimit(clientIdentifier)) {
    return {
      isValid: false,
      reason: "レート制限に達しました",
      securityLevel: "LOW",
    };
  }

  // 2. 環境変数とヘッダー取得
  const cronSecret = process.env.CRON_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  const vercelCronHeader = request.headers.get("user-agent");
  const authHeader = request.headers.get("authorization");

  // 3. 本番環境ではVercel Cronヘッダーを必須とする
  if (nodeEnv === "production" && vercelCronHeader !== "vercel-cron/1.0") {
    return {
      isValid: false,
      reason: "Vercel Cronリクエストではありません",
      securityLevel: "LOW",
    };
  }

  // 4. 認証トークンチェック
  if (cronSecret) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        isValid: false,
        reason: "認証ヘッダーが必要です",
        securityLevel: "LOW",
      };
    }

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
  } else {
    // 認証トークンが設定されていない場合の警告
    console.warn("⚠️ CRON_SECRET環境変数が設定されていません");

    // 開発環境ではVercelヘッダーのみで許可
    if (nodeEnv === "development") {
      return {
        isValid: true,
        securityLevel: "LOW",
      };
    }

    // 本番環境ではVercelヘッダーを必須とし、トークンなしでは拒否
    return {
      isValid: false,
      reason: "認証ヘッダーが必要です",
      securityLevel: "MEDIUM",
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
  const ip =
    request.ip ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const env = process.env.NODE_ENV || "unknown";

  console.log(
    `🔒 セキュリティ: ${type} [${securityLevel}] - ENV: ${env}, IP: ${ip}, UA: ${userAgent}${
      reason ? `, 理由: ${reason}` : ""
    }`
  );
}
