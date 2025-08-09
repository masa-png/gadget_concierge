import { NextRequest } from "next/server";
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
  rateLimit,
  setSecurityHeaders,
  validateRequest,
} from "@/lib/api/middleware";
import { ErrorCodes } from "@/lib/validations/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// セッション作成のバリデーションスキーマ
const createSessionSchema = z.object({
  categoryId: z.string().cuid("有効なカテゴリIDを指定してください"),
});

// セッション作成 API
export async function POST(request: NextRequest) {
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

    // リクエストボディのバリデーション
    const validator = validateRequest(createSessionSchema, "body");
    const bodyValidation = await validator(request);
    if (!bodyValidation.success) {
      return bodyValidation.response;
    }

    const { categoryId } = bodyValidation.data;

    // ユーザープロフィールを取得または作成
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          username: null,
          full_name: null,
          avatar_url: null,
        },
      });
    }

    // カテゴリの存在確認
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      return createErrorResponse(
        "指定されたカテゴリが見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // 既存の未完了セッションがあるかチェック
    const existingSession = await prisma.questionnaireSession.findFirst({
      where: {
        userProfileId: userProfile.id,
        categoryId: categoryId,
        status: "IN_PROGRESS",
      },
      orderBy: {
        created_at: "desc",
      },
    });

    if (existingSession) {
      // 既存のセッションを返す
      const response = createSuccessResponse({
        session: {
          id: existingSession.id,
          categoryId: existingSession.categoryId,
          status: existingSession.status,
          started_at: existingSession.started_at,
          isExisting: true,
        },
      });
      return setSecurityHeaders(response);
    }

    // 新しいセッションを作成
    const newSession = await prisma.questionnaireSession.create({
      data: {
        userProfileId: userProfile.id,
        categoryId: categoryId,
        status: "IN_PROGRESS",
      },
    });

    const response = createSuccessResponse({
      session: {
        id: newSession.id,
        categoryId: newSession.categoryId,
        status: newSession.status,
        started_at: newSession.started_at,
        isExisting: false,
      },
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Session POST error:", error);
    return createErrorResponse(
      "セッションの作成中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// セッション一覧取得 API
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
      return createSuccessResponse({ sessions: [] });
    }

    // ユーザーのセッション一覧を取得
    const sessions = await prisma.questionnaireSession.findMany({
      where: {
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
      orderBy: {
        created_at: "desc",
      },
      take: 20, // 最新20件まで
    });

    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      categoryId: session.categoryId,
      categoryName: session.category?.name || "不明なカテゴリ",
      status: session.status,
      started_at: session.started_at,
      completed_at: session.completed_at,
      answerCount: session._count.answers,
    }));

    const response = createSuccessResponse({
      sessions: formattedSessions,
      total: formattedSessions.length,
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Sessions GET error:", error);
    return createErrorResponse(
      "セッション一覧の取得中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}
