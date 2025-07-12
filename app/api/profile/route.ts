import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  rateLimit,
  setSecurityHeaders,
} from "@/lib/api/middleware";
import { ErrorCodes } from "@/lib/validations/api";

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
