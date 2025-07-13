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
import { getUserProfile, getSession } from "@/lib/api/helpers";

// 回答保存のバリデーションスキーマ
const createAnswerSchema = z
  .object({
    sessionId: z.string().cuid("有効なセッションIDを指定してください"),
    questionId: z.string().cuid("有効な質問IDを指定してください"),
    questionOptionId: z.string().cuid().optional(),
    questionOptionIds: z.array(z.string().cuid()).optional(),
    range_value: z.number().int().min(0).max(100).optional(),
    text_value: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      // 少なくとも1つの回答値が提供されていることを確認
      return !!(
        data.questionOptionId ||
        (data.questionOptionIds && data.questionOptionIds.length > 0) ||
        data.range_value !== undefined ||
        (data.text_value && data.text_value.trim().length > 0)
      );
    },
    {
      message: "回答値を1つ以上指定してください",
    }
  );

// 回答保存 API
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const clientIP = request.ip || "unknown";
    if (!rateLimit(clientIP, 100, 60000)) {
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
    const validator = validateRequest(createAnswerSchema, "body");
    const bodyValidation = await validator(request);
    if (!bodyValidation.success) {
      return bodyValidation.response;
    }

    const {
      sessionId,
      questionId,
      questionOptionId,
      questionOptionIds,
      range_value,
      text_value,
    } = bodyValidation.data;

    // 共通ヘルパーでユーザープロフィール・セッション取得
    const userProfile = await getUserProfile(user.id);
    const session = await getSession(sessionId, userProfile.id);
    if (session.status !== "IN_PROGRESS") {
      return createErrorResponse(
        "進行中のセッションのみ回答できます",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 質問の存在確認
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        type: true,
        categoryId: true,
        is_required: true,
      },
    });

    if (!question) {
      return createErrorResponse(
        "指定された質問が見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // 質問がセッションのカテゴリに属しているか確認
    if (question.categoryId !== session.categoryId) {
      return createErrorResponse(
        "質問がセッションのカテゴリと一致しません",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 質問タイプに応じたバリデーション
    let finalQuestionOptionId = null;

    if (question.type === "SINGLE_CHOICE") {
      if (!questionOptionId) {
        return createErrorResponse(
          "単一選択の質問には選択肢IDが必要です",
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
      finalQuestionOptionId = questionOptionId;
    } else if (question.type === "MULTIPLE_CHOICE") {
      // 複数選択の場合、最初の選択肢IDを保存（実際の実装では配列対応が必要）
      if (!questionOptionIds || questionOptionIds.length === 0) {
        return createErrorResponse(
          "複数選択の質問には最低1つの選択肢IDが必要です",
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
      finalQuestionOptionId = questionOptionIds[0]; // 暫定的な実装
    } else if (question.type === "RANGE") {
      if (range_value === undefined || range_value === null) {
        return createErrorResponse(
          "範囲選択の質問には数値が必要です",
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    } else if (question.type === "TEXT") {
      if (!text_value || text_value.trim().length === 0) {
        return createErrorResponse(
          "テキスト入力の質問には文字列が必要です",
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // 選択肢IDが指定されている場合、その選択肢が質問に属しているか確認
    if (finalQuestionOptionId) {
      const option = await prisma.questionOption.findFirst({
        where: {
          id: finalQuestionOptionId,
          questionId: questionId,
        },
      });

      if (!option) {
        return createErrorResponse(
          "指定された選択肢が質問に属していません",
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // 既存の回答があるかチェック
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        questionnaireSessionId_questionId: {
          questionnaireSessionId: sessionId,
          questionId: questionId,
        },
      },
    });

    let savedAnswer;

    if (existingAnswer) {
      // 既存の回答を更新
      savedAnswer = await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          questionOptionId: finalQuestionOptionId,
          range_value: range_value,
          text_value: text_value,
        },
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
    } else {
      // 新しい回答を作成
      savedAnswer = await prisma.answer.create({
        data: {
          questionnaireSessionId: sessionId,
          questionId: questionId,
          questionOptionId: finalQuestionOptionId,
          range_value: range_value,
          text_value: text_value,
        },
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
    }

    // レスポンスデータを整形
    const responseData = {
      answer: {
        id: savedAnswer.id,
        questionId: savedAnswer.questionId,
        questionText: savedAnswer.question.text,
        questionType: savedAnswer.question.type,
        questionOptionId: savedAnswer.questionOptionId,
        questionOptionIds: savedAnswer.questionOptionId
          ? [savedAnswer.questionOptionId]
          : [],
        range_value: savedAnswer.range_value,
        text_value: savedAnswer.text_value,
        option: savedAnswer.option,
        created_at: savedAnswer.created_at,
        updated_at: savedAnswer.updated_at,
      },
      isUpdate: !!existingAnswer,
    };

    const response = createSuccessResponse(responseData);
    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Answer POST error:", error);
    return createErrorResponse(
      "回答の保存中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}

// セッションの回答一覧取得 API
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

    // URLパラメータからセッションIDを取得
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      return createErrorResponse(
        "セッションIDが必要です",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 共通ヘルパーでユーザープロフィール・セッション取得
    const userProfile = await getUserProfile(user.id);
    const session = await getSession(sessionId, userProfile.id);

    // 回答一覧を取得
    const answers = await prisma.answer.findMany({
      where: {
        questionnaireSessionId: sessionId,
      },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            type: true,
            is_required: true,
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
    });

    const formattedAnswers = answers.map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      questionText: answer.question.text,
      questionType: answer.question.type,
      isRequired: answer.question.is_required,
      questionOptionId: answer.questionOptionId,
      questionOptionIds: answer.questionOptionId
        ? [answer.questionOptionId]
        : [],
      range_value: answer.range_value,
      text_value: answer.text_value,
      option: answer.option,
      created_at: answer.created_at,
      updated_at: answer.updated_at,
    }));

    const response = createSuccessResponse({
      sessionId: sessionId,
      answers: formattedAnswers,
      total: formattedAnswers.length,
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Answers GET error:", error);
    return createErrorResponse(
      "回答一覧の取得中にエラーが発生しました",
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
    "GET, POST, PUT, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

// バッチ回答保存 API（複数の回答を一度に保存）
export async function PUT(request: NextRequest) {
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

    // リクエストボディの解析
    const body = await request.json();
    const { sessionId, answers } = body;
    if (!sessionId || !Array.isArray(answers) || answers.length === 0) {
      return createErrorResponse(
        "セッションIDと回答配列が必要です",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 共通ヘルパーでユーザープロフィール・セッション取得
    const userProfile = await getUserProfile(user.id);
    const session = await getSession(sessionId, userProfile.id);
    if (session.status !== "IN_PROGRESS") {
      return createErrorResponse(
        "進行中のセッションのみ回答できます",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // トランザクション内で複数回答を処理
    const savedAnswers = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const answerData of answers) {
        const { questionId, questionOptionId, range_value, text_value } =
          answerData;

        if (!questionId) {
          throw new Error("質問IDが必要です");
        }

        // 既存の回答があるかチェック
        const existingAnswer = await tx.answer.findUnique({
          where: {
            questionnaireSessionId_questionId: {
              questionnaireSessionId: sessionId,
              questionId: questionId,
            },
          },
        });

        let savedAnswer;
        if (existingAnswer) {
          // 更新
          savedAnswer = await tx.answer.update({
            where: { id: existingAnswer.id },
            data: {
              questionOptionId: questionOptionId || null,
              range_value: range_value || null,
              text_value: text_value || null,
            },
          });
        } else {
          // 新規作成
          savedAnswer = await tx.answer.create({
            data: {
              questionnaireSessionId: sessionId,
              questionId: questionId,
              questionOptionId: questionOptionId || null,
              range_value: range_value || null,
              text_value: text_value || null,
            },
          });
        }

        results.push(savedAnswer);
      }

      return results;
    });

    const response = createSuccessResponse({
      savedAnswers: savedAnswers.map((answer) => ({
        id: answer.id,
        questionId: answer.questionId,
        questionOptionId: answer.questionOptionId,
        range_value: answer.range_value,
        text_value: answer.text_value,
      })),
      total: savedAnswers.length,
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Batch answers PUT error:", error);
    return createErrorResponse(
      "回答の一括保存中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
