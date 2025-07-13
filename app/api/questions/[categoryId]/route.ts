// 公開API（質問データは誰でも閲覧可能）

import { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  rateLimit,
  setSecurityHeaders,
} from "@/lib/api/middleware";
import { ErrorCodes } from "@/lib/validations/api";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    categoryId: string;
  };
}

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

    const { categoryId } = params;

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

    // カテゴリに関連する質問と選択肢を取得
    const questions = await prisma.question.findMany({
      where: {
        categoryId: categoryId,
      },
      include: {
        options: {
          select: {
            id: true,
            label: true,
            description: true,
            icon_url: true,
            value: true,
          },
          orderBy: {
            created_at: "asc",
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // レスポンス形式を整形
    const formattedQuestions = questions.map((question) => ({
      id: question.id,
      text: question.text,
      description: question.description,
      type: question.type,
      is_required: question.is_required,
      options: question.options || [],
    }));

    const response = createSuccessResponse({
      category: {
        id: category.id,
        name: category.name,
      },
      questions: formattedQuestions,
      total: formattedQuestions.length,
    });

    // キャッシュ設定（質問データは比較的静的）
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=1800"
    );

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Questions GET error:", error);
    return createErrorResponse(
      "質問データの取得中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}
