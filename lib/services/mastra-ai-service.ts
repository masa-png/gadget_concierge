/**
 * Mastra AI Service Implementation
 *
 * AI レコメンド生成のための Mastra AI との連携を処理します。
 * HTTP リクエスト、タイムアウト、リトライ、エラーハンドリングを含む
 * 堅牢な通信処理を提供します。
 */

import { getMastraClient } from "./mastra-client";
import { AI_RECOMMENDATION_CONFIG } from "../config/ai-recommendations";
import {
  AIRecommendationRequest,
  AIRecommendationResponse,
  MastraAIService,
} from "../types/ai-recommendations";
import {
  createAIRecommendationError,
  handleAIRecommendationError,
  isRetryableError,
} from "../errors/ai-recommendation-error";
import {
  aiResponseAnalyzer,
  ResponseAnalysisResult,
} from "./ai-response-analyzer";
import { z } from "zod";

/**
 * AI レスポンスの検証スキーマ
 */
const AIRecommendationItemSchema = z.object({
  productName: z.string().min(1, "商品名は必須です"),
  reason: z.string().min(1, "推薦理由は必須です"),
  score: z.number().min(0).max(1, "スコアは0-1の範囲である必要があります"),
  features: z.array(z.string()).min(1, "特徴は最低1つ必要です"),
  priceRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .optional(),
});

const AIRecommendationResponseSchema = z.object({
  recommendations: z
    .array(AIRecommendationItemSchema)
    .min(1, "最低1つのレコメンドが必要です")
    .max(50, "レコメンドは最大50個までです"),
});

/**
 * リトライ設定
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
  backoffMultiplier: 2,
};

/**
 * Mastra AI Service の実装クラス
 */
export class MastraAIServiceImpl implements MastraAIService {
  private readonly retryConfig: RetryConfig;

  constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig;
  }

  /**
   * AI レコメンドを生成します
   * @param request レコメンド生成リクエスト
   * @returns AI レコメンドレスポンス
   * @throws AIRecommendationError
   */
  async generateRecommendations(
    request: AIRecommendationRequest
  ): Promise<AIRecommendationResponse> {
    try {
      // リクエストの検証
      this.validateRequest(request);

      // リトライ付きでAI呼び出しを実行
      const rawResponse = await this.executeWithRetry(
        () => this.callMastraAI(request),
        this.retryConfig
      );

      // 高度なレスポンス分析と検証
      const analysisResult = await this.analyzeAndValidateResponse(rawResponse);

      // 分析結果に基づく処理
      if (!analysisResult.isValid) {
        const errorMessages = analysisResult.issues
          .filter((issue) => issue.type === "ERROR")
          .map((issue) => issue.message)
          .join("; ");

        throw createAIRecommendationError.aiResponseInvalid(
          `レスポンス検証に失敗しました: ${errorMessages}`,
          {
            analysisResult,
            qualityScore: analysisResult.qualityScore,
          }
        );
      }

      // 品質スコアが低い場合の警告ログ
      if (analysisResult.qualityScore < 0.7) {
        console.warn(
          `AI レスポンスの品質スコアが低いです: ${analysisResult.qualityScore}`,
          {
            issues: analysisResult.issues,
            metadata: analysisResult.metadata,
          }
        );
      }

      return analysisResult.normalizedResponse;
    } catch (error) {
      throw handleAIRecommendationError(error, {
        request: {
          promptLength: request.prompt.length,
          maxRecommendations: request.maxRecommendations,
          temperature: request.temperature,
        },
      });
    }
  }

  /**
   * AI レスポンスの構造を検証します
   * @param response 検証対象のレスポンス
   * @returns 検証結果
   */
  validateResponse(response: unknown): response is AIRecommendationResponse {
    try {
      AIRecommendationResponseSchema.parse(response);
      return true;
    } catch (error) {
      console.error("AI レスポンス検証エラー:", error);
      return false;
    }
  }

  /**
   * リクエストの検証
   * @param request 検証対象のリクエスト
   * @throws AIRecommendationError
   */
  private validateRequest(request: AIRecommendationRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw createAIRecommendationError.invalidRequestData(
        "プロンプトが空です",
        { request }
      );
    }

    if (request.prompt.length > 10000) {
      throw createAIRecommendationError.invalidRequestData(
        "プロンプトが長すぎます (最大10,000文字)",
        { promptLength: request.prompt.length }
      );
    }

    if (request.maxRecommendations < 1 || request.maxRecommendations > 50) {
      throw createAIRecommendationError.invalidRequestData(
        "maxRecommendations は 1-50 の範囲である必要があります",
        { maxRecommendations: request.maxRecommendations }
      );
    }

    if (
      request.temperature !== undefined &&
      (request.temperature < 0 || request.temperature > 1)
    ) {
      throw createAIRecommendationError.invalidRequestData(
        "temperature は 0-1 の範囲である必要があります",
        { temperature: request.temperature }
      );
    }
  }

  /**
   * レスポンスの分析と検証を実行します
   * @param rawResponse 生のAIレスポンス
   * @returns 分析結果
   */
  private async analyzeAndValidateResponse(
    rawResponse: unknown
  ): Promise<ResponseAnalysisResult> {
    return await aiResponseAnalyzer.analyzeResponse(rawResponse);
  }

  /**
   * Mastra AI への実際の呼び出し
   * @param request リクエストデータ
   * @returns 生のAIレスポンス
   * @throws AIRecommendationError
   */
  private async callMastraAI(
    request: AIRecommendationRequest
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, AI_RECOMMENDATION_CONFIG.timeouts.aiRequest);

    try {
      // Mastra クライアントを取得
      const mastraClient = getMastraClient();

      // AI 呼び出しの実行
      // 注意: 実際の Mastra API の仕様に応じて調整が必要
      const rawResponse = await this.performMastraRequest(
        mastraClient,
        request,
        controller.signal
      );

      return rawResponse;
    } catch (error) {
      if (controller.signal.aborted) {
        throw createAIRecommendationError.aiRequestTimeout(
          AI_RECOMMENDATION_CONFIG.timeouts.aiRequest,
          { request }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Mastra への実際のリクエスト実行
   * 注意: この実装は Mastra の実際の API 仕様に応じて調整が必要です
   * @param mastraClient Mastra クライアント
   * @param request リクエストデータ
   * @param signal AbortSignal
   * @returns 生のAIレスポンス
   */
  private async performMastraRequest(
    mastraClient: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    request: AIRecommendationRequest,
    signal: AbortSignal
  ): Promise<unknown> {
    try {
      // Mastra の実際の API 呼び出し
      // この部分は Mastra の具体的な実装に応じて調整が必要
      const result = await fetch(AI_RECOMMENDATION_CONFIG.mastra.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_RECOMMENDATION_CONFIG.mastra.apiKey}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          max_recommendations: request.maxRecommendations,
          temperature:
            request.temperature || AI_RECOMMENDATION_CONFIG.aiTemperature,
        }),
        signal,
      });

      if (!result.ok) {
        const errorText = await result.text().catch(() => "Unknown error");

        switch (result.status) {
          case 401:
            throw createAIRecommendationError.aiAuthenticationFailed({
              status: result.status,
              error: errorText,
            });
          case 429:
            throw createAIRecommendationError.aiRateLimitExceeded({
              status: result.status,
              error: errorText,
            });
          case 503:
            throw createAIRecommendationError.aiServiceUnavailable({
              status: result.status,
              error: errorText,
            });
          default:
            throw createAIRecommendationError.aiServiceUnavailable({
              status: result.status,
              error: errorText,
            });
        }
      }

      const responseData = await result.json();

      // 生のレスポンスデータを返す（正規化は分析段階で実行）
      return responseData;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw createAIRecommendationError.networkError(error);
      }
      throw error;
    }
  }

  /**
   * リトライ付きで関数を実行します
   * @param fn 実行する関数
   * @param config リトライ設定
   * @returns 関数の実行結果
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 最後の試行の場合はエラーを投げる
        if (attempt === config.maxAttempts) {
          break;
        }

        // リトライ可能なエラーかチェック
        const aiError = handleAIRecommendationError(error);
        if (!isRetryableError(aiError)) {
          throw aiError;
        }

        // 指数バックオフで待機
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        console.warn(
          `AI リクエスト失敗 (試行 ${attempt}/${config.maxAttempts}): ${lastError.message}. ${delay}ms 後にリトライします...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * デフォルトの Mastra AI Service インスタンス
 */
export const mastraAIService = new MastraAIServiceImpl();

/**
 * テスト用のファクトリー関数
 */
export function createMastraAIService(
  retryConfig?: Partial<RetryConfig>
): MastraAIService {
  return new MastraAIServiceImpl({
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig,
  });
}
