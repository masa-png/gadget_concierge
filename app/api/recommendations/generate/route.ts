import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  rateLimit,
  setSecurityHeaders,
  validateRequest,
} from "@/lib/api/middleware";
import { ErrorCodes } from "@/lib/validations/api";
import { z } from "zod";

// AIレコメンド生成のバリデーションスキーマ
const generateRecommendationSchema = z.object({
  sessionId: z.string().cuid("有効なセッションIDを指定してください"),
});

// AIレコメンド生成API
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const clientIP = request.ip || "unknown";
    if (!rateLimit(clientIP, 10, 60000)) {
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

    // リクエストボディのバリデーション
    const validator = validateRequest(generateRecommendationSchema, "body");
    const bodyValidation = await validator(request);
    if (!bodyValidation.success) {
      return bodyValidation.response;
    }

    const { sessionId } = bodyValidation.data;

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

    // セッション取得（完了済みのみ）
    const session = await prisma.questionnaireSession.findFirst({
      where: {
        id: sessionId,
        userProfileId: userProfile.id,
        status: "COMPLETED",
      },
    });

    if (!session) {
      return createErrorResponse(
        "指定されたセッションが見つからないか、完了していません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // カテゴリ情報を取得
    const category = await prisma.category.findUnique({
      where: { id: session.categoryId as string },
      select: { id: true, name: true },
    });

    // 回答一覧を取得
    const answers = await prisma.answer.findMany({
      where: { questionnaireSessionId: sessionId },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            type: true,
          },
        },
        option: {
          select: {
            id: true,
            label: true,
            value: true,
          },
        },
      },
    });

    // 既存のレコメンドがあるかチェック
    const existingRecommendations = await prisma.recommendation.findMany({
      where: { questionnaireSessionId: sessionId },
    });

    if (existingRecommendations.length > 0) {
      return createErrorResponse(
        "このセッションのレコメンドは既に生成されています",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // TODO: Mastra AI連携の実装
    // 1. 回答データの構造化
    // 2. カテゴリ別プロンプト生成
    // 3. AIエージェントへのリクエスト送信
    // 4. レスポンスパース・整形
    // 5. レコメンド結果のDB保存

    const responseData = {
      sessionId: session.id,
      categoryName: category?.name || "不明なカテゴリ",
      answerCount: answers.length,
      message: "AIレコメンド生成を開始しました",
      // TODO: 実際のAI生成結果を返す
      recommendations: [],
    };

    return setSecurityHeaders(createSuccessResponse(responseData));
  } catch (error) {
    console.error("Recommendation generation error:", error);
    return createErrorResponse(
      "AIレコメンド生成中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
