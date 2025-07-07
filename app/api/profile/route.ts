import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  validateRequest,
  createErrorResponse,
  createSuccessResponse,
  rateLimit,
  setSecurityHeaders,
} from "@/lib/api/middleware";
import {
  CreateProfileSchema,
  ErrorCodes,
} from "@/lib/validations/api";

export async function GET(request: NextRequest) {
  try {
    // レート制限チェック
    const clientIP = request.ip || "unknown";
    if (!rateLimit(clientIP, 100, 60000)) {
      return createErrorResponse(
        "リクエスト数が上限を超えました",
        429,
        ErrorCodes.RATE_LIMITED
      );
    }

    // 認証チェック
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;

    // プロフィールを取得
    const profile = await prisma.userProfile.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        username: true,
        full_name: true,
        avatar_url: true,
        questionCount: true,
        recommendationCount: true,
        created_at: true,
        updated_at: true,
      },
    });

    const response = createSuccessResponse({ profile });
    response.headers.set(
      "Cache-Control",
      "private, max-age=300, stale-while-revalidate=60"
    );

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Profile GET error:", error);
    return createErrorResponse(
      "プロフィールの取得中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const clientIP = request.ip || "unknown";
    if (!rateLimit(clientIP, 30, 60000)) {
      return createErrorResponse(
        "リクエスト数が上限を超えました",
        429,
        ErrorCodes.RATE_LIMITED
      );
    }

    // 認証チェック
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { user } = authResult;

    // バリデーション
    const validationResult = await validateRequest(CreateProfileSchema)(
      request
    );
    if (!validationResult.success) {
      return validationResult.response;
    }

    const { username, full_name, avatar_url } = validationResult.data;

    // ユーザー名の重複チェック
    if (username) {
      const existingProfile = await prisma.userProfile.findFirst({
        where: {
          username,
          NOT: {
            userId: user.id,
          },
        },
      });

      if (existingProfile) {
        return createErrorResponse(
          "このユーザー名は既に使用されています",
          409,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // プロフィールをupsert
    const profile = await prisma.userProfile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        username:
          username ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "user",
        full_name:
          full_name ||
          user.user_metadata?.full_name ||
          user.email ||
          "名前未設定",
        avatar_url: avatar_url || user.user_metadata?.avatar_url,
        updated_at: new Date(),
      },
      create: {
        userId: user.id,
        username:
          username ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "user",
        full_name:
          full_name ||
          user.user_metadata?.full_name ||
          user.email ||
          "名前未設定",
        avatar_url: avatar_url || user.user_metadata?.avatar_url,
      },
      select: {
        id: true,
        userId: true,
        username: true,
        full_name: true,
        avatar_url: true,
        questionCount: true,
        recommendationCount: true,
        created_at: true,
        updated_at: true,
      },
    });

    const response = createSuccessResponse(
      { profile },
      "プロフィールが正常に作成/更新されました",
      201
    );

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Profile POST error:", error);
    return createErrorResponse(
      "プロフィールの作成/更新中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
