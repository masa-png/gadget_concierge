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

// セッション中断API
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
        "完了済みのセッションは中断できません",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
    if (session.status === "ABANDONED") {
      return createErrorResponse(
        "このセッションは既に中断されています",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // セッションを中断
    const pausedSession = await prisma.questionnaireSession.update({
      where: { id: sessionId },
      data: {
        status: "ABANDONED",
      },
    });

    const responseData = {
      session: {
        id: pausedSession.id,
        categoryId: pausedSession.categoryId,
        status: pausedSession.status,
        started_at: pausedSession.started_at,
        paused_at: new Date(),
      },
      message: "セッションが正常に中断されました",
    };

    return setSecurityHeaders(createSuccessResponse(responseData));
  } catch (error) {
    console.error("Session PAUSE error:", error);
    if (error instanceof Response) return error;
    return createErrorResponse(
      "セッション中断中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
