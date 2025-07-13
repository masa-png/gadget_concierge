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

interface RouteParams {
  params: {
    sessionId: string;
  };
}

// レコメンド結果取得API
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const { sessionId } = params;

    // ユーザープロフィールを取得
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });
    if (!userProfile) {
      return createErrorResponse(
        "ユーザープロフィールが見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // セッション取得
    const session = await prisma.questionnaireSession.findFirst({
      where: {
        id: sessionId,
        userProfileId: userProfile.id,
      },
    });
    if (!session) {
      return createErrorResponse(
        "指定されたセッションが見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // カテゴリ情報を取得
    const category = await prisma.category.findUnique({
      where: { id: session.categoryId as string },
      select: { id: true, name: true },
    });

    // レコメンド一覧を取得
    const recommendations = await prisma.recommendation.findMany({
      where: { questionnaireSessionId: sessionId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            rating: true,
            features: true,
            rakuten_url: true,
            image_url: true,
          },
        },
      },
      orderBy: { rank: "asc" },
    });

    if (recommendations.length === 0) {
      return createErrorResponse(
        "このセッションのレコメンドが見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // レスポンスデータを整形
    const responseData = {
      session: {
        id: session.id,
        categoryId: session.categoryId,
        categoryName: category?.name || "不明なカテゴリ",
        status: session.status,
        completed_at: session.completed_at,
      },
      recommendations: recommendations.map((rec) => ({
        id: rec.id,
        rank: rec.rank,
        score: rec.score,
        reason: rec.reason,
        product: {
          id: rec.product.id,
          name: rec.product.name,
          description: rec.product.description,
          price: rec.product.price,
          rating: rec.product.rating,
          features: rec.product.features,
          rakuten_url: rec.product.rakuten_url,
          image_url: rec.product.image_url,
        },
      })),
      total: recommendations.length,
    };

    return setSecurityHeaders(createSuccessResponse(responseData));
  } catch (error) {
    console.error("Recommendation GET error:", error);
    return createErrorResponse(
      "レコメンド結果の取得中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
