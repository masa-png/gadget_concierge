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

// 動的レンダリングを明示的に指定
export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    sessionId: string;
  };
}

// セッション再開API
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // 共通ヘルパーでユーザープロフィール・セッション取得
    const userProfile = await getUserProfile(user.id);
    const session = await getSession(sessionId, userProfile.id);

    if (session.status === "COMPLETED") {
      return createErrorResponse(
        "完了済みのセッションは再開できません",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
    if (session.status === "IN_PROGRESS") {
      return createErrorResponse(
        "このセッションは既に進行中です",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // セッションを再開
    const resumedSession = await prisma.questionnaireSession.update({
      where: { id: sessionId },
      data: {
        status: "IN_PROGRESS",
      },
    });

    const responseData = {
      session: {
        id: resumedSession.id,
        categoryId: resumedSession.categoryId,
        status: resumedSession.status,
        started_at: resumedSession.started_at,
        resumed_at: new Date(),
      },
      message: "セッションが正常に再開されました",
    };

    return setSecurityHeaders(createSuccessResponse(responseData));
  } catch (error) {
    console.error("Session RESUME error:", error);
    if (error instanceof Response) return error;
    return createErrorResponse(
      "セッション再開中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
