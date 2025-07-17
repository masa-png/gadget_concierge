import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createErrorResponse,
  createSuccessResponse,
  rateLimit,
  setSecurityHeaders,
} from "@/lib/api/middleware";
import { ErrorCodes } from "@/lib/validations/api";

interface RouteParams {
  params: {
    categoryId: string;
  };
}

// カテゴリ詳細取得API（公開API）
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

    // カテゴリ詳細を取得
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        keyPoints: {
          select: {
            id: true,
            point: true,
          },
          orderBy: { created_at: "asc" },
        },
        commonQuestions: {
          select: {
            id: true,
            question: true,
            answer: true,
          },
          orderBy: { created_at: "asc" },
        },
        subCategories: {
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: { name: "asc" },
        },
        parentCategory: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!category) {
      return createErrorResponse(
        "指定されたカテゴリが見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // レスポンスデータを整形
    const responseData = {
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        parentCategory: category.parentCategory
          ? {
              id: category.parentCategory.id,
              name: category.parentCategory.name,
              description: category.parentCategory.description,
            }
          : null,
        subCategories: category.subCategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          description: sub.description,
        })),
        keyPoints: category.keyPoints.map((point) => ({
          id: point.id,
          point: point.point,
        })),
        commonQuestions: category.commonQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
        })),
      },
    };

    const response = createSuccessResponse(responseData);

    // キャッシュ設定（カテゴリデータは比較的静的）
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=1800"
    );

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Category detail GET error:", error);
    return createErrorResponse(
      "カテゴリ詳細の取得中にエラーが発生しました",
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
