import { NextRequest } from "next/server";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  rateLimit,
  setSecurityHeaders,
} from "@/lib/api/middleware";
import { ErrorCodes } from "@/lib/validations/api";
import { prisma } from "@/lib/prisma";
import { getUserProfile, checkRequiredAnswers } from "@/lib/api/helpers";

// 動的レンダリングを明示的に指定
export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    sessionId: string;
  };
}

// セッション完了処理 API
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // レート制限チェック
    const clientIP = request.ip || "unknown";
    if (!rateLimit(clientIP, 20, 60000)) {
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
    const session = await prisma.questionnaireSession.findFirst({
      where: { id: sessionId, userProfileId: userProfile.id },
      include: {
        category: { select: { id: true, name: true } },
        answers: {
          include: {
            question: {
              select: { id: true, text: true, type: true, is_required: true },
            },
          },
        },
      },
    });
    if (!session) {
      return createErrorResponse(
        "指定されたセッションが見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }
    if (session.status === "COMPLETED") {
      return createSuccessResponse({
        session: {
          id: session.id,
          status: session.status,
          completed_at: session.completed_at,
        },
        message: "セッションは既に完了しています",
      });
    }

    if (!session.categoryId) {
      return createErrorResponse(
        "カテゴリIDが設定されていません",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 必須質問未回答チェック（共通ヘルパー）
    const unansweredRequiredQuestions = await checkRequiredAnswers(
      sessionId,
      session.categoryId
    );
    if (unansweredRequiredQuestions.length > 0) {
      return createErrorResponse(
        `必須質問への回答が不足しています: ${unansweredRequiredQuestions
          .map((q) => q.text)
          .join(", ")}`,
        400,
        ErrorCodes.VALIDATION_ERROR,
        { unansweredQuestions: unansweredRequiredQuestions }
      );
    }

    // トランザクション内でセッション完了処理
    const result = await prisma.$transaction(async (tx) => {
      // セッションステータスを完了に更新
      const completedSession = await tx.questionnaireSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          completed_at: new Date(),
        },
      });
      // ユーザープロフィールの質問数カウンターを更新
      await tx.userProfile.update({
        where: { id: userProfile.id },
        data: { questionCount: { increment: 1 } },
      });
      // ユーザー履歴を作成
      const userHistory = await tx.userHistory.create({
        data: {
          userProfileId: userProfile.id,
          type: "QUESTIONNAIRE",
          title: `${session.category?.name || "不明なカテゴリ"}の診断`,
          description: `質問数: ${session.answers.length}件`,
          status: "COMPLETED",
          sessionId: sessionId,
          categoryId: session.categoryId,
          completion_rate: 100,
          details_json: {
            answersCount: session.answers.length,
            requiredQuestionsCount: session.answers.length, // 厳密には必須数
            categoryName: session.category?.name,
            completedAt: completedSession.completed_at,
          },
        },
      });
      return { session: completedSession, history: userHistory };
    });

    const response = createSuccessResponse({
      session: {
        id: result.session.id,
        categoryId: result.session.categoryId,
        categoryName: session.category?.name,
        status: result.session.status,
        started_at: result.session.started_at,
        completed_at: result.session.completed_at,
        answersCount: session.answers.length,
      },
      history: {
        id: result.history.id,
        title: result.history.title,
        description: result.history.description,
        created_at: result.history.created_at,
      },
      message: "診断が正常に完了しました",
    });
    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Session complete error:", error);
    if (error instanceof Response) return error;
    return createErrorResponse(
      "セッション完了処理中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// セッション完了状況取得 API
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

    // セッション情報を取得
    const session = await prisma.questionnaireSession.findFirst({
      where: {
        id: sessionId,
        userProfileId: userProfile.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });

    if (!session) {
      return createErrorResponse(
        "指定されたセッションが見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // カテゴリの総質問数と必須質問数を取得
    const questionStats = await prisma.question.aggregate({
      where: {
        categoryId: session.categoryId as string,
      },
      _count: {
        id: true,
      },
    });

    const requiredQuestionStats = await prisma.question.aggregate({
      where: {
        categoryId: session.categoryId as string,
        is_required: true,
      },
      _count: {
        id: true,
      },
    });

    // 完了率を計算
    const totalQuestions = questionStats._count.id || 0;
    const answeredQuestions = session._count.answers || 0;
    const completionRate =
      totalQuestions > 0
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0;

    // 完了可能かどうかを判断（必須質問に全て回答済みか）
    const answeredQuestionIds = await prisma.answer.findMany({
      where: {
        questionnaireSessionId: sessionId,
      },
      select: {
        questionId: true,
      },
    });

    const requiredQuestions = await prisma.question.findMany({
      where: {
        categoryId: session.categoryId as string,
        is_required: true,
      },
      select: {
        id: true,
      },
    });

    const answeredQuestionSet = new Set(
      answeredQuestionIds.map((a) => a.questionId)
    );
    const canComplete = requiredQuestions.every((q) =>
      answeredQuestionSet.has(q.id)
    );

    const response = createSuccessResponse({
      session: {
        id: session.id,
        categoryId: session.categoryId,
        categoryName: session.category?.name,
        status: session.status,
        started_at: session.started_at,
        completed_at: session.completed_at,
      },
      progress: {
        totalQuestions: totalQuestions,
        requiredQuestions: requiredQuestionStats._count.id || 0,
        answeredQuestions: answeredQuestions,
        completionRate: completionRate,
        canComplete: canComplete,
        isCompleted: session.status === "COMPLETED",
      },
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Session completion status GET error:", error);
    return createErrorResponse(
      "完了状況の取得中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}
