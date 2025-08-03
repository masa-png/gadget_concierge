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

// セッション詳細取得 API
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

    // セッション詳細を取得（ユーザーが所有者であることを確認）
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
        answers: {
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
          orderBy: {
            created_at: "asc",
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

    // 回答データを整形
    const formattedAnswers = session.answers.map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      questionText: answer.question.text,
      questionType: answer.question.type,
      questionOptionId: answer.questionOptionId,
      questionOptionIds: answer.questionOptionId
        ? [answer.questionOptionId]
        : [], // 複数選択対応のため配列化
      range_value: answer.range_value,
      text_value: answer.text_value,
      option: answer.option,
      created_at: answer.created_at,
    }));

    const response = createSuccessResponse({
      session: {
        id: session.id,
        categoryId: session.categoryId,
        categoryName: session.category?.name || "不明なカテゴリ",
        status: session.status,
        started_at: session.started_at,
        completed_at: session.completed_at,
        answers: formattedAnswers,
        answerCount: formattedAnswers.length,
      },
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Session GET error:", error);
    return createErrorResponse(
      "セッション詳細の取得中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// セッション更新 API（ステータス変更など）
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // セッションの存在とオーナーシップを確認
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

    // リクエストボディを解析
    const body = await request.json();
    const { status } = body;

    // ステータスの妥当性チェック
    const validStatuses = ["IN_PROGRESS", "COMPLETED", "ABANDONED"];
    if (status && !validStatuses.includes(status)) {
      return createErrorResponse(
        "無効なステータスです",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 更新データを準備
    const updateData: { status?: "IN_PROGRESS" | "COMPLETED" | "ABANDONED"; completed_at?: Date } = {};
    if (status) {
      updateData.status = status as "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
      if (status === "COMPLETED") {
        updateData.completed_at = new Date();
      }
    }

    // セッションを更新
    const updatedSession = await prisma.questionnaireSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response = createSuccessResponse({
      session: {
        id: updatedSession.id,
        categoryId: updatedSession.categoryId,
        categoryName: updatedSession.category?.name || "不明なカテゴリ",
        status: updatedSession.status,
        started_at: updatedSession.started_at,
        completed_at: updatedSession.completed_at,
      },
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Session PUT error:", error);
    return createErrorResponse(
      "セッションの更新中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// セッション削除 API
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // セッションの存在とオーナーシップを確認
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

    // セッションを削除（Cascadeで関連データも削除される）
    await prisma.questionnaireSession.delete({
      where: { id: sessionId },
    });

    const response = createSuccessResponse({
      message: "セッションが正常に削除されました",
      deletedSessionId: sessionId,
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Session DELETE error:", error);
    return createErrorResponse(
      "セッションの削除中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}
