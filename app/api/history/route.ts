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

// 履歴一覧取得API
export async function GET(request: NextRequest) {
  try {
    // レート制限チェック
    const clientIP = request.ip || "unknown";
    if (!rateLimit(clientIP, 50, 60000)) {
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

    // ユーザープロフィールを取得
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });
    if (!userProfile) {
      return createSuccessResponse({ histories: [] });
    }

    // URLパラメータからページネーション情報を取得
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const type = url.searchParams.get("type"); // QUESTIONNAIRE, RECOMMENDATION

    // クエリ条件を構築
    const where: { userProfileId: string; type?: "QUESTIONNAIRE" | "RECOMMENDATION" } = { userProfileId: userProfile.id };
    if (type && (type === "QUESTIONNAIRE" || type === "RECOMMENDATION")) {
      where.type = type;
    }

    // 履歴一覧を取得
    const histories = await prisma.userHistory.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        session: {
          select: {
            id: true,
            status: true,
            completed_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 総件数を取得
    const total = await prisma.userHistory.count({ where });

    // レスポンスデータを整形
    const responseData = {
      histories: histories.map((history) => ({
        id: history.id,
        type: history.type,
        title: history.title,
        description: history.description,
        status: history.status,
        score: history.score,
        completion_rate: history.completion_rate,
        category: history.category
          ? {
              id: history.category.id,
              name: history.category.name,
            }
          : null,
        session: history.session
          ? {
              id: history.session.id,
              status: history.session.status,
              completed_at: history.session.completed_at,
            }
          : null,
        created_at: history.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return setSecurityHeaders(createSuccessResponse(responseData));
  } catch (error) {
    console.error("History GET error:", error);
    return createErrorResponse(
      "履歴一覧の取得中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
