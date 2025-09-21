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

// セキュリティとバリデーション機能のインポート
import {
  sanitizeInput,
  validateApiKey,
  withTimeout,
  checkRateLimit,
  maskSensitiveData,
} from "@/lib/utils/security";
import {
  generateRecommendationRequestSchema,
  validateSessionId,
  validateAIRecommendationResponse,
  validateProcessedAnswers,
} from "@/lib/validations/ai-recommendations";

// サービス統合のインポート（要件 4.1, 6.1, 6.2, 6.3, 6.4）
import { createAnswerProcessor } from "@/lib/services/answer-processor";
import { createPromptGenerator } from "@/lib/services/prompt-generator";
import { mastraAIService } from "@/lib/services/mastra-ai-service";
import { productMapperService } from "@/lib/services/product-mapper";
import { recommendationSaverService } from "@/lib/services/recommendation-saver";
import {
  AI_RECOMMENDATION_CONFIG,
  initializeAIConfig,
} from "@/lib/config/ai-recommendations";
import {
  handleAIRecommendationError,
  createAIRecommendationError,
} from "@/lib/errors/ai-recommendation-error";
import { errorHandler } from "@/lib/services/error-handler";
import {
  aiRecommendationLogger,
  monitoringService,
} from "@/lib/services/logger";
import type {
  ProcessedAnswer,
  ProductMatch,
  RecommendationData,
} from "@/lib/types/ai-recommendations";

// 動的レンダリングを明示的に指定
export const dynamic = "force-dynamic";

// バリデーションスキーマは lib/validations/ai-recommendations.ts から使用

/**
 * メインレコメンド生成フロー
 * 要件 4.1, 6.1, 6.2, 6.3, 6.4: 各サービスクラスを統合したメイン処理フロー
 *
 * @param sessionId アンケートセッションID
 * @param categoryId カテゴリID
 * @param userProfile ユーザープロフィール
 * @returns 生成されたレコメンドデータの配列
 */
async function executeRecommendationFlow(
  sessionId: string,
  categoryId: string,
  userProfile: { id: string; userId: string; full_name: string | null }
): Promise<RecommendationData[]> {
  // パフォーマンストラッキング開始
  aiRecommendationLogger.startTracking();

  const context = {
    sessionId,
    categoryId,
    userId: userProfile.userId,
    userProfileId: userProfile.id,
    operation: "executeRecommendationFlow",
  };

  aiRecommendationLogger.logRecommendationStart(context);

  try {
    // ステップ 1: セキュリティ強化された回答データの処理（要件 1.2, 1.3, 7.5）
    aiRecommendationLogger.logDebug("回答データ処理開始", context);

    const answerProcessor = createAnswerProcessor();
    const rawProcessedAnswers = await answerProcessor.processSessionAnswers(
      sessionId
    );

    // 回答データのセキュリティ検証
    const processedAnswers: ProcessedAnswer[] =
      validateProcessedAnswers(rawProcessedAnswers);

    aiRecommendationLogger.logDebug("回答データ処理完了", context, {
      answersCount: processedAnswers.length,
    });

    // ステップ 2: AI用データ構造化（要件 1.3, 3.4）
    aiRecommendationLogger.logDebug("AI用データ構造化開始", context);

    const aiInputData = await answerProcessor.structureForAI(processedAnswers);

    aiRecommendationLogger.logDebug("AI用データ構造化完了", context, {
      categoryName: aiInputData.categoryName,
    });

    // ステップ 3: プロンプト生成（要件 1.4, 3.1, 3.2）
    aiRecommendationLogger.logDebug("プロンプト生成開始", context);

    const promptGenerator = createPromptGenerator();
    const aiPrompt = await promptGenerator.generatePrompt(
      categoryId,
      {
        fullName: userProfile.full_name,
        userId: userProfile.userId,
        preferences: aiInputData.userProfile.preferences,
      },
      processedAnswers
    );

    aiRecommendationLogger.logDebug("プロンプト生成完了", context, {
      promptLength: aiPrompt.length,
    });

    // ステップ 4: セキュリティ強化されたAI レコメンド生成（要件 1.5, 2.1, 2.2, 7.5）
    aiRecommendationLogger.logAIRequestStart(context, aiPrompt.length);

    const aiRequestStartTime = Date.now();

    // タイムアウト制御付きAI呼び出し
    const rawAiResponse = await withTimeout(
      mastraAIService.generateRecommendations({
        prompt: aiPrompt,
        maxRecommendations: AI_RECOMMENDATION_CONFIG.maxRecommendations,
        temperature: AI_RECOMMENDATION_CONFIG.aiTemperature,
      }),
      AI_RECOMMENDATION_CONFIG.timeouts.aiRequest,
      "AI推奨生成リクエストがタイムアウトしました"
    );

    // AIレスポンスのセキュリティ検証
    const aiResponse = validateAIRecommendationResponse(rawAiResponse);
    const aiRequestDuration = Date.now() - aiRequestStartTime;

    aiRecommendationLogger.logAIRequestComplete(
      context,
      aiRequestDuration,
      aiResponse.recommendations.length
    );

    // ステップ 5: 商品マッピング（要件 1.6, 5.2, 5.3, 5.4, 5.5）
    aiRecommendationLogger.logMappingStart(
      context,
      aiResponse.recommendations.length
    );

    const mappingStartTime = Date.now();
    const productMatches: (ProductMatch | null)[] = [];

    for (let index = 0; index < aiResponse.recommendations.length; index++) {
      const aiRecommendation = aiResponse.recommendations[index];
      try {
        const match = await productMapperService.mapWithConfidenceEvaluation(
          aiRecommendation,
          categoryId
        );
        productMatches.push(match);

        if (match) {
          aiRecommendationLogger.logDebug(
            `商品マッピング成功 ${index + 1}/${
              aiResponse.recommendations.length
            }`,
            context,
            {
              productId: match.productId,
              confidence: match.confidence,
            }
          );
        } else {
          aiRecommendationLogger.logWarning(
            `商品マッピング失敗 ${index + 1}/${
              aiResponse.recommendations.length
            }`,
            context,
            {
              aiProductName: aiRecommendation.productName,
            }
          );
        }
      } catch (mappingError) {
        aiRecommendationLogger.logError(
          `商品マッピングエラー ${index + 1}/${
            aiResponse.recommendations.length
          }`,
          mappingError,
          context,
          {
            aiProductName: aiRecommendation.productName,
          }
        );
        productMatches.push(null);
      }
    }

    const mappingDuration = Date.now() - mappingStartTime;
    const mappingStats =
      productMapperService.getMatchingStatistics(productMatches);

    aiRecommendationLogger.logMappingComplete(
      context,
      mappingDuration,
      mappingStats
    );

    // ステップ 6: レコメンドデータ準備（要件 1.7, 1.8, 3.3）
    aiRecommendationLogger.logDebug("レコメンドデータ準備開始", context);

    const recommendationData: RecommendationData[] = [];
    let rank = 1;

    for (let i = 0; i < aiResponse.recommendations.length; i++) {
      const aiRecommendation = aiResponse.recommendations[i];
      const productMatch = productMatches[i];

      if (productMatch) {
        recommendationData.push({
          sessionId,
          productId: productMatch.productId,
          rank,
          score: aiRecommendation.score,
          reason: aiRecommendation.reason,
        });
        rank++;
      }
    }

    aiRecommendationLogger.logDebug("レコメンドデータ準備完了", context, {
      finalRecommendationsCount: recommendationData.length,
    });

    // ステップ 7: データベース保存（要件 1.7, 1.8, 2.3, 6.5）
    aiRecommendationLogger.logSaveStart(context, recommendationData.length);

    if (recommendationData.length === 0) {
      throw createAIRecommendationError.noValidRecommendations(sessionId, {
        aiRecommendationsCount: aiResponse.recommendations.length,
        mappingStats,
      });
    }

    const saveStartTime = Date.now();
    await recommendationSaverService.saveRecommendations(recommendationData);
    const saveDuration = Date.now() - saveStartTime;

    aiRecommendationLogger.logSaveComplete(
      context,
      saveDuration,
      recommendationData.length
    );

    // フロー完了ログ（要件 6.4: 正常生成時の件数と基本メタデータ記録）
    aiRecommendationLogger.logRecommendationComplete(
      context,
      recommendationData.length,
      {
        aiRequestDuration,
        mappingDuration,
        saveDuration,
        mappingStats,
      }
    );

    return recommendationData;
  } catch (error) {
    // フローエラーログ（要件 6.3: エラー詳細とスタックトレースの記録）
    aiRecommendationLogger.logError("レコメンドフロー失敗", error, context);

    // エラーハンドリング（要件 2.1, 2.2, 2.3, 2.5）
    throw handleAIRecommendationError(error, {
      operation: "executeRecommendationFlow",
      sessionId,
      categoryId,
    });
  }
}

/**
 * AIレコメンド生成API エンドポイント
 * POST /api/recommendations/generate
 *
 * 要件 7.3: 既存のミドルウェア（requireAuth、rateLimit）を統合
 * 要件 7.4: リクエストバリデーションとレスポンス形式を実装
 * 要件 7.5: セキュリティヘッダーとエラーハンドリング
 */
export async function POST(request: NextRequest) {
  const tracker = aiRecommendationLogger.startTracking();
  let sessionId: string | undefined;
  let userId: string | undefined;

  try {
    // セキュリティ強化されたレート制限チェック（要件 7.5: セキュリティ機能）
    const clientIP = request.ip || "unknown";

    try {
      // 既存のミドルウェアレート制限
      if (!rateLimit(clientIP, 10, 60000)) {
        aiRecommendationLogger.logWarning("レート制限超過", {}, { clientIP });
        return createErrorResponse(
          "リクエスト数が上限を超えました。しばらく時間をおいてから再試行してください",
          429,
          ErrorCodes.RATE_LIMITED
        );
      }

      // 追加のセキュリティレート制限（より厳格）
      checkRateLimit(`ai-recommendations:${clientIP}`, 5, 300000); // 5分間で5回まで
    } catch (rateLimitError) {
      aiRecommendationLogger.logWarning(
        "セキュリティレート制限超過",
        {},
        {
          clientIP,
          error:
            rateLimitError instanceof Error
              ? rateLimitError.message
              : String(rateLimitError),
        }
      );

      return createErrorResponse(
        "AI推奨生成の利用制限に達しました。しばらく時間をおいてから再試行してください",
        429,
        ErrorCodes.RATE_LIMITED
      );
    }

    // 認証チェック（要件 7.3: 既存ミドルウェア統合）
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      aiRecommendationLogger.logWarning("認証失敗", {}, { clientIP });
      return authResult.response;
    }
    const { user } = authResult;
    userId = user.id;

    // セキュリティ強化されたリクエストバリデーション（要件 7.4, 7.5）
    const validator = validateRequest(
      generateRecommendationRequestSchema,
      "body"
    );
    const bodyValidation = await validator(request);
    if (!bodyValidation.success) {
      aiRecommendationLogger.logWarning(
        "バリデーション失敗",
        { userId },
        { clientIP }
      );
      return bodyValidation.response;
    }

    const { sessionId: rawSessionId } = bodyValidation.data;

    // 入力サニタイゼーション（要件 7.5: 入力サニタイゼーション）
    try {
      const sanitizedSessionId = sanitizeInput(rawSessionId, {
        maxLength: 50,
        allowedChars: "a-zA-Z0-9_-",
        removePII: true,
        removeHtml: true,
      });

      // セッションIDの追加検証
      sessionId = validateSessionId(sanitizedSessionId);
    } catch (sanitizationError) {
      aiRecommendationLogger.logWarning(
        "入力サニタイゼーション失敗",
        { userId },
        {
          clientIP,
          error:
            sanitizationError instanceof Error
              ? sanitizationError.message
              : String(sanitizationError),
        }
      );

      return createErrorResponse(
        "無効な入力データが検出されました",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // リクエスト開始ログ（要件 6.1: セッションIDとユーザーコンテキストのログ記録）
    const requestContext = {
      sessionId,
      userId,
      operation: "generateRecommendations",
    };
    aiRecommendationLogger.logRecommendationStart(requestContext);

    // ユーザープロフィールを取得
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!userProfile) {
      aiRecommendationLogger.logError(
        "ユーザープロフィール未発見",
        new Error("User profile not found"),
        requestContext
      );

      return createErrorResponse(
        "ユーザープロフィールが見つかりません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // セッション取得と所有権確認（完了済みのみ）
    const session = await prisma.questionnaireSession.findFirst({
      where: {
        id: sessionId,
        userProfileId: userProfile.id,
        status: "COMPLETED",
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      aiRecommendationLogger.logWarning(
        "セッション未発見または未完了",
        requestContext,
        {
          userProfileId: userProfile.id,
        }
      );

      return createErrorResponse(
        "指定されたセッションが見つからないか、完了していません",
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    // 既存のレコメンドがあるかチェック（重複生成防止）
    const existingRecommendations = await prisma.recommendation.findMany({
      where: { questionnaireSessionId: sessionId },
    });

    if (existingRecommendations.length > 0) {
      aiRecommendationLogger.logWarning("重複生成試行", requestContext, {
        existingCount: existingRecommendations.length,
      });

      return createErrorResponse(
        "このセッションのレコメンドは既に生成されています",
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // 基本検証完了ログ
    aiRecommendationLogger.logDebug("基本検証完了", requestContext, {
      categoryId: session.categoryId,
      categoryName: session.category?.name,
    });

    // セキュリティ強化されたAI設定の検証（要件 2.1, 7.5）
    try {
      // 設定の初期化と検証
      initializeAIConfig();

      // APIキーの安全性検証
      validateApiKey(AI_RECOMMENDATION_CONFIG.mastra.apiKey, "Mastra API Key");

      aiRecommendationLogger.logDebug("AI設定検証完了", requestContext, {
        mastraUrl: AI_RECOMMENDATION_CONFIG.mastra.apiUrl,
        maxRecommendations: AI_RECOMMENDATION_CONFIG.maxRecommendations,
        apiKeyMasked: maskSensitiveData(AI_RECOMMENDATION_CONFIG.mastra.apiKey),
      });
    } catch (configError) {
      aiRecommendationLogger.logError(
        "AI設定エラー",
        configError,
        requestContext
      );

      return setSecurityHeaders(
        createErrorResponse(
          "AI設定に問題があります。管理者にお問い合わせください",
          500,
          ErrorCodes.INTERNAL_ERROR
        )
      );
    }

    // タイムアウト制御付きメインフロー実行（要件 4.1, 6.1, 6.2, 6.3, 6.4, 7.5）
    const recommendations = await withTimeout(
      executeRecommendationFlow(
        sessionId,
        session.categoryId as string,
        userProfile
      ),
      AI_RECOMMENDATION_CONFIG.timeouts.aiRequest + 30000, // AI処理時間 + 30秒のバッファ
      "AI推奨生成処理がタイムアウトしました"
    );

    // 成功レスポンス（要件 7.4: レスポンス形式、要件 7.5: セキュリティヘッダー）
    const finalMetrics = tracker.finish();

    const responseData = {
      sessionId: session.id,
      categoryId: session.categoryId,
      categoryName: session.category?.name || "不明なカテゴリ",
      status: "completed",
      message: "AIレコメンドが正常に生成されました",
      recommendationsCount: recommendations.length,
      processingTime: finalMetrics.duration,
    };

    aiRecommendationLogger.logRecommendationComplete(
      requestContext,
      recommendations.length,
      { processingTime: finalMetrics.duration }
    );

    // モニタリング統計を更新
    monitoringService.recordSuccess(finalMetrics);

    return setSecurityHeaders(createSuccessResponse(responseData));
  } catch (error) {
    const finalMetrics = tracker.finish();

    // 新しいエラーハンドラーを使用（要件 2.1, 2.2, 2.3, 2.5）
    const errorContext = {
      operation: "generateRecommendations",
      sessionId,
      userId,
      duration: finalMetrics.duration,
    };

    // エラーログとモニタリング統計の更新
    aiRecommendationLogger.logError(
      "レコメンド生成エラー",
      error,
      errorContext
    );

    // 新しいエラーハンドラーでレスポンスを生成
    const errorResponse = errorHandler.handle(error, errorContext);

    // 要件 7.5: セキュリティヘッダーを設定
    return setSecurityHeaders(errorResponse);
  }
}
