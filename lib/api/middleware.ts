import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { ApiResponse, ErrorCodes } from "@/lib/validations/api";

// レート制限用のメモリマップ（本番環境ではRedisなどを使用）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// レート制限チェック
export function rateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// API エラーレスポンス作成
export function createErrorResponse(
  error: string,
  status: number = 400,
  code?: string,
  extra?: Record<string, any>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
      ...(extra && extra),
    },
    { status }
  );
}

// API 成功レスポンス作成
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      ...(data && { data }),
      ...(message && { message }),
    },
    { status }
  );
}

// 認証チェックミドルウェア
export async function requireAuth(
  request: NextRequest
): Promise<
  { success: true; user: any } | { success: false; response: NextResponse }
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        success: false,
        response: createErrorResponse(
          "認証が必要です",
          401,
          ErrorCodes.UNAUTHORIZED
        ),
      };
    }

    return { success: true, user };
  } catch (error) {
    console.error("認証エラー:", error);
    return {
      success: false,
      response: createErrorResponse(
        "認証処理中にエラーが発生しました",
        500,
        ErrorCodes.INTERNAL_ERROR
      ),
    };
  }
}

// バリデーションミドルウェア
export function validateRequest<T extends z.ZodSchema>(
  schema: T,
  source: "body" | "query" = "body"
) {
  return async (
    request: NextRequest
  ): Promise<
    | { success: true; data: z.infer<T> }
    | { success: false; response: NextResponse }
  > => {
    try {
      let data: any;

      if (source === "body") {
        const body = await request.json();
        data = body;
      } else {
        const url = new URL(request.url);
        data = Object.fromEntries(url.searchParams.entries());
      }

      const result = schema.safeParse(data);

      if (!result.success) {
        const errorMessage = result.error.errors
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");

        return {
          success: false,
          response: createErrorResponse(
            `バリデーションエラー: ${errorMessage}`,
            400,
            ErrorCodes.VALIDATION_ERROR
          ),
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        response: createErrorResponse(
          "リクエストの解析に失敗しました",
          400,
          ErrorCodes.VALIDATION_ERROR
        ),
      };
    }
  };
}

// CORS設定
export function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

// セキュリティヘッダー設定
export function setSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return response;
}
