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

// 動的レンダリングを明示的に指定
export const dynamic = "force-dynamic";

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

    // Mastra AI連携の実装

    // 1. 回答データの構造化
    const answerSummary = answers.map((answer) => ({
      question: answer.question.text,
      answer: answer.option?.label || answer.text_value || "",
      type: answer.question.type,
    }));

    // 2. カテゴリ別プロンプト生成
    const promptData = {
      category: category?.name || "不明なカテゴリ",
      answers: answerSummary,
      userProfile: {
        // 必要に応じてユーザープロフィール情報を追加
      },
    };

    // 3. 該当カテゴリの製品データを取得
    const products = await prisma.product.findMany({
      where: {
        productCategories: {
          some: {
            categoryId: session.categoryId as string,
          },
        },
      },
      take: 20, // 上位20製品を対象とする
      orderBy: { rating: "desc" },
    });

    console.log("Products for recommendation:", products);

    if (products.length === 0) {
      return createErrorResponse(
        "指定されたカテゴリに製品が登録されていません",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (answers.length === 0) {
      return createErrorResponse(
        "このセッションには回答が存在しません",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 4. AIエージェントへのリクエスト送信
    try {
      const { mastra } = await import("@/mastra");
      const agent = mastra.getAgent("gadgetRecommendationAgent");

      const aiPrompt = `
以下のユーザー情報に基づいて、最適なガジェットを推奨してください。

## カテゴリ
${promptData.category}

## ユーザーの回答
${promptData.answers
  .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
  .join("\n\n")}

## 利用可能な製品リスト
${products
  .map(
    (p) => `
製品名: ${p.name}
ショップ: ${p.shop_name || "不明"}
価格: ${p.price}円
評価: ${p.rating}/5
特徴: ${p.features}
説明: ${p.description || ""}
`
  )
  .join("\n---\n")}

上記の製品から、ユーザーに最も適した3つを選んで推奨してください。
各製品について、推奨理由を具体的に説明してください。
`;

      const aiResponse = await agent.generateLegacy([
        { role: "user", content: aiPrompt },
      ]);
      console.log(aiResponse);

      // 5. AI応答の解析・パース
      let aiRecommendations;
      try {
        // AI応答からJSONを抽出
        const responseText = aiResponse.text || "";
        const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);

        if (jsonMatch) {
          aiRecommendations = JSON.parse(jsonMatch[1]);
        } else {
          // JSONマーカーがない場合、全体をJSONとして解析を試行
          aiRecommendations = JSON.parse(responseText);
        }

        // 応答形式の検証
        if (
          !aiRecommendations.recommendations ||
          !Array.isArray(aiRecommendations.recommendations)
        ) {
          throw new Error("Invalid AI response format");
        }
      } catch (parseError) {
        console.warn(
          "AI応答の解析に失敗、フォールバック処理を実行:",
          parseError
        );
        // パースエラーの場合はフォールバック処理
        throw new Error("AI_PARSE_ERROR");
      }

      // 6. AI推奨に基づいてレコメンド結果をDB保存
      const savedRecommendations = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        aiRecommendations.recommendations.map(async (aiRec: any) => {
          // 製品名でマッチング
          const matchedProduct = products.find(
            (p) => p.name === aiRec.productName
          );

          if (!matchedProduct) {
            console.warn(`推奨製品が見つかりません: ${aiRec.productName}`);
            return null;
          }

          return await prisma.recommendation.create({
            data: {
              questionnaireSessionId: sessionId,
              productId: matchedProduct.id,
              rank: aiRec.rank || 1,
              score: aiRec.score || 0.8,
              reason:
                aiRec.reason ||
                `${matchedProduct.name}があなたに推奨されました。`,
            },
          });
        })
      );

      // null値を除外
      const validRecommendations = savedRecommendations.filter(
        (rec) => rec !== null
      );

      // レコメンド生成成功時にrecommendationCountをインクリメント
      if (validRecommendations.length > 0) {
        await prisma.userProfile.update({
          where: { id: userProfile.id },
          data: { recommendationCount: { increment: 1 } },
        });
      }

      return setSecurityHeaders(
        createSuccessResponse({
          sessionId: session.id,
          categoryName: category?.name || "不明なカテゴリ",
          answerCount: answers.length,
          message: "レコメンドの作成が完了しました",
          recommendations: validRecommendations.map((rec) => ({
            id: rec.id,
            rank: rec.rank,
            score: rec.score,
            reason: rec.reason,
          })),
          aiResponse: aiResponse.text, // デバッグ用
        })
      );
    } catch (aiError) {
      console.error("レコメンドの作成エラー:", aiError);
      // AI生成エラーの場合、フォールバック処理
      const fallbackRecommendations = products
        .slice(0, 3)
        .map(async (product, index) => {
          return await prisma.recommendation.create({
            data: {
              questionnaireSessionId: sessionId,
              productId: product.id,
              rank: index + 1,
              score: Math.max(0.6, 0.9 - index * 0.1),
              reason: `${product.name}は高評価の製品です。${category?.name}カテゴリで人気があり、多くのユーザーに選ばれています。`,
            },
          });
        });

      const savedFallbackRecs = await Promise.all(fallbackRecommendations);

      // フォールバック推奨生成成功時にもrecommendationCountをインクリメント
      if (savedFallbackRecs.length > 0) {
        await prisma.userProfile.update({
          where: { id: userProfile.id },
          data: { recommendationCount: { increment: 1 } },
        });
      }

      return setSecurityHeaders(
        createSuccessResponse({
          sessionId: session.id,
          categoryName: category?.name || "不明なカテゴリ",
          answerCount: answers.length,
          message: "レコメンドの作成が完了しました（基本推奨）",
          recommendations: savedFallbackRecs.map((rec) => ({
            id: rec.id,
            rank: rec.rank,
            score: rec.score,
            reason: rec.reason,
          })),
          error: "AI生成でエラーが発生したため、基本推奨を使用しました",
        })
      );
    }
  } catch (error) {
    console.error("レコメンドの作成エラー:", error);
    return createErrorResponse(
      "AIレコメンド生成中にエラーが発生しました",
      500,
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
