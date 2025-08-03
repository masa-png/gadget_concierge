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
import { getUserProfile, getSession } from "@/lib/api/helpers";

interface RouteParams {
  params: {
    sessionId: string;
  };
}

// セッション進行API
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // 共通ヘルパーでユーザープロフィール・セッション取得
    const userProfile = await getUserProfile(user.id);
    const session = await getSession(sessionId, userProfile.id);
    if (session.status === "COMPLETED") {
      return createErrorResponse(
        "このセッションは既に完了しています",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 質問リスト取得
    const questions = await prisma.question.findMany({
      where: { categoryId: session.categoryId as string },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        text: true,
        description: true,
        type: true,
        is_required: true,
        options: {
          select: {
            id: true,
            label: true,
            description: true,
            icon_url: true,
            value: true,
          },
          orderBy: { created_at: "asc" },
        },
      },
    });
    if (!questions.length) {
      return createErrorResponse(
        "このカテゴリには質問がありません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // 回答一覧取得
    const answers = await prisma.answer.findMany({
      where: { questionnaireSessionId: sessionId },
      select: {
        questionId: true,
        questionOptionId: true,
        range_value: true,
        text_value: true,
      },
    });
    const answeredMap = new Map(answers.map((a) => [a.questionId, a]));

    // 必須質問の未回答チェック
    const unansweredRequired = questions.filter(
      (q) => q.is_required && !answeredMap.has(q.id)
    );

    // 次の質問を決定（未回答の最初の質問）
    const nextQuestion = questions.find((q) => !answeredMap.has(q.id));

    // 完了判定
    const isCompleted = !nextQuestion;

    // レスポンス構築
    const responseData: {
      sessionId: string;
      categoryId: string | null;
      isCompleted: boolean;
      unansweredRequired: Array<{ id: string; text: string; type: string }>;
      nextQuestion: {
        id: string;
        text: string;
        description: string | null;
        type: string;
        is_required: boolean;
        options: Array<unknown>;
      } | null;
      answeredCount: number;
      totalQuestions: number;
    } = {
      sessionId: session.id,
      categoryId: session.categoryId,
      isCompleted,
      unansweredRequired: unansweredRequired.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
      })),
      nextQuestion: nextQuestion
        ? {
            id: nextQuestion.id,
            text: nextQuestion.text,
            description: nextQuestion.description,
            type: nextQuestion.type,
            is_required: nextQuestion.is_required,
            options: nextQuestion.options ? nextQuestion.options : [],
          }
        : null,
      answeredCount: answers.length,
      totalQuestions: questions.length,
    };

    return setSecurityHeaders(createSuccessResponse(responseData));
  } catch (error) {
    console.error("Session NEXT error:", error);
    if (error instanceof Response) return error;
    return createErrorResponse(
      "セッション進行中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
