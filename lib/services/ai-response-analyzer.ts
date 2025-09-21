/**
 * AI Response Analyzer Service
 *
 * AI からのレスポンスデータの構造検証、解析、正規化処理を提供します。
 * レコメンドデータの品質チェックと一貫性の確保を行います。
 */

import { z } from "zod";
import {
  AIRecommendationResponse,
  AIRecommendationItem,
} from "../types/ai-recommendations";
import {
  createAIRecommendationError,
  handleAIRecommendationError,
} from "../errors/ai-recommendation-error";
import { AI_RECOMMENDATION_CONFIG } from "../config/ai-recommendations";

/**
 * レスポンス分析結果
 */
export interface ResponseAnalysisResult {
  isValid: boolean;
  normalizedResponse: AIRecommendationResponse;
  qualityScore: number;
  issues: ResponseIssue[];
  metadata: ResponseMetadata;
}

/**
 * レスポンスの問題点
 */
export interface ResponseIssue {
  type: "WARNING" | "ERROR";
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * レスポンスメタデータ
 */
export interface ResponseMetadata {
  totalRecommendations: number;
  averageScore: number;
  scoreDistribution: {
    high: number; // 0.8以上
    medium: number; // 0.5-0.8
    low: number; // 0.5未満
  };
  hasIncompleteData: boolean;
  processingTime: number;
}

/**
 * 詳細な検証スキーマ
 */
const PriceRangeSchema = z
  .object({
    min: z.number().min(0, "最小価格は0以上である必要があります"),
    max: z.number().min(0, "最大価格は0以上である必要があります"),
  })
  .refine((data) => data.max >= data.min, {
    message: "最大価格は最小価格以上である必要があります",
    path: ["max"],
  });

const AIRecommendationItemSchema = z.object({
  productName: z
    .string()
    .min(1, "商品名は必須です")
    .max(200, "商品名は200文字以内である必要があります")
    .refine((name) => name.trim().length > 0, "商品名は空白のみではいけません"),
  reason: z
    .string()
    .min(1, "推薦理由は必須です") // 最小長を1に変更（品質チェックは別途実行）
    .max(1000, "推薦理由は1000文字以内である必要があります"),
  score: z
    .number()
    .min(0, "スコアは0以上である必要があります")
    .max(1, "スコアは1以下である必要があります"),
  features: z
    .array(z.string().min(1))
    .min(0, "特徴配列は必須です") // 最小長を0に変更（品質チェックは別途実行）
    .max(20, "特徴は最大20個までです"),
  priceRange: PriceRangeSchema.optional(),
});

const AIRecommendationResponseSchema = z.object({
  recommendations: z
    .array(AIRecommendationItemSchema)
    .min(1, "最低1つのレコメンドが必要です")
    .max(
      AI_RECOMMENDATION_CONFIG.maxRecommendations,
      `レコメンドは最大${AI_RECOMMENDATION_CONFIG.maxRecommendations}個までです`
    ),
});

/**
 * AI Response Analyzer の実装クラス
 */
export class AIResponseAnalyzer {
  /**
   * AI レスポンスを包括的に分析します
   * @param rawResponse 生のAIレスポンス
   * @returns 分析結果
   */
  async analyzeResponse(rawResponse: unknown): Promise<ResponseAnalysisResult> {
    const startTime = Date.now();
    const issues: ResponseIssue[] = [];

    try {
      // 基本構造の検証
      const basicValidation = this.validateBasicStructure(rawResponse);
      if (!basicValidation.isValid) {
        return {
          isValid: false,
          normalizedResponse: { recommendations: [] },
          qualityScore: 0,
          issues: basicValidation.issues,
          metadata: {
            totalRecommendations: 0,
            averageScore: 0,
            scoreDistribution: { high: 0, medium: 0, low: 0 },
            hasIncompleteData: true,
            processingTime: Date.now() - startTime,
          },
        };
      }

      // レスポンスの正規化
      const normalizedResponse = this.normalizeResponse(rawResponse);

      // 詳細検証
      const detailedValidation =
        this.validateDetailedStructure(normalizedResponse);
      issues.push(...detailedValidation.issues);

      // 品質分析
      const qualityAnalysis = this.analyzeQuality(normalizedResponse);
      issues.push(...qualityAnalysis.issues);

      // メタデータ生成
      const metadata = this.generateMetadata(
        normalizedResponse,
        Date.now() - startTime
      );

      // 最終的な有効性判定
      const hasErrors = issues.some((issue) => issue.type === "ERROR");
      const qualityScore = this.calculateQualityScore(
        normalizedResponse,
        issues
      );

      return {
        isValid: !hasErrors && qualityScore >= 0.5,
        normalizedResponse,
        qualityScore,
        issues,
        metadata,
      };
    } catch (error) {
      const aiError = handleAIRecommendationError(error, { rawResponse });

      return {
        isValid: false,
        normalizedResponse: { recommendations: [] },
        qualityScore: 0,
        issues: [
          {
            type: "ERROR",
            code: "ANALYSIS_FAILED",
            message: `レスポンス分析に失敗しました: ${aiError.message}`,
            context: { error: aiError },
          },
        ],
        metadata: {
          totalRecommendations: 0,
          averageScore: 0,
          scoreDistribution: { high: 0, medium: 0, low: 0 },
          hasIncompleteData: true,
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 基本構造の検証
   * @param rawResponse 生のレスポンス
   * @returns 基本検証結果
   */
  private validateBasicStructure(rawResponse: unknown): {
    isValid: boolean;
    issues: ResponseIssue[];
  } {
    const issues: ResponseIssue[] = [];

    // null/undefined チェック
    if (rawResponse === null || rawResponse === undefined) {
      issues.push({
        type: "ERROR",
        code: "NULL_RESPONSE",
        message: "レスポンスがnullまたはundefinedです",
      });
      return { isValid: false, issues };
    }

    // オブジェクト型チェック
    if (typeof rawResponse !== "object") {
      issues.push({
        type: "ERROR",
        code: "INVALID_TYPE",
        message: `レスポンスの型が無効です。期待値: object, 実際: ${typeof rawResponse}`,
        context: { actualType: typeof rawResponse },
      });
      return { isValid: false, issues };
    }

    // 配列または recommendations プロパティの存在チェック
    const response = rawResponse as Record<string, unknown>;
    const hasRecommendations = Array.isArray(response.recommendations);
    const isDirectArray = Array.isArray(rawResponse);

    if (!hasRecommendations && !isDirectArray) {
      issues.push({
        type: "ERROR",
        code: "MISSING_RECOMMENDATIONS",
        message:
          "recommendationsプロパティまたは配列形式のレスポンスが見つかりません",
        context: { availableKeys: Object.keys(response) },
      });
      return { isValid: false, issues };
    }

    return { isValid: true, issues };
  }

  /**
   * レスポンスの正規化
   * @param rawResponse 生のレスポンス
   * @returns 正規化されたレスポンス
   */
  private normalizeResponse(rawResponse: unknown): AIRecommendationResponse {
    if (Array.isArray(rawResponse)) {
      // 直接配列の場合
      return {
        recommendations: rawResponse.map((item, index) =>
          this.normalizeRecommendationItem(item, index)
        ),
      };
    }

    const response = rawResponse as Record<string, unknown>;
    if (Array.isArray(response.recommendations)) {
      return {
        recommendations: response.recommendations.map((item, index) =>
          this.normalizeRecommendationItem(item, index)
        ),
      };
    }

    throw createAIRecommendationError.aiResponseInvalid(
      "正規化できないレスポンス形式",
      { rawResponse }
    );
  }

  /**
   * 個別レコメンドアイテムの正規化
   * @param item 生のアイテム
   * @param index アイテムのインデックス
   * @returns 正規化されたアイテム
   */
  private normalizeRecommendationItem(
    item: unknown,
    index: number
  ): AIRecommendationItem {
    if (typeof item !== "object" || item === null) {
      throw createAIRecommendationError.aiResponseInvalid(
        `レコメンドアイテム[${index}]が無効です`,
        { item, index }
      );
    }

    const itemObj = item as Record<string, unknown>;

    // 各フィールドの正規化
    const productName = this.normalizeString(
      itemObj.productName || itemObj.product_name || itemObj.name || ""
    );

    const reason = this.normalizeString(
      itemObj.reason || itemObj.description || itemObj.explanation || ""
    );

    const score = this.normalizeScore(
      itemObj.score || itemObj.confidence || itemObj.rating || 0
    );

    const features = this.normalizeFeatures(
      itemObj.features || itemObj.tags || itemObj.attributes || []
    );

    const priceRange = this.normalizePriceRange(
      itemObj.priceRange || itemObj.price_range || itemObj.price
    );

    return {
      productName,
      reason,
      score,
      features,
      priceRange,
    };
  }

  /**
   * 文字列の正規化
   */
  private normalizeString(value: unknown): string {
    if (typeof value === "string") {
      return value.trim();
    }
    return String(value || "").trim();
  }

  /**
   * スコアの正規化
   */
  private normalizeScore(value: unknown): number {
    const num = Number(value);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(1, num));
  }

  /**
   * 特徴配列の正規化
   */
  private normalizeFeatures(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => this.normalizeString(item))
        .filter((item) => item.length > 0)
        .slice(0, 20); // 最大20個まで
    }

    if (typeof value === "string" && value.trim()) {
      // カンマ区切りの文字列を配列に変換
      return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 20);
    }

    return [];
  }

  /**
   * 価格範囲の正規化
   */
  private normalizePriceRange(
    value: unknown
  ): { min: number; max: number } | undefined {
    if (typeof value === "object" && value !== null) {
      const priceObj = value as Record<string, unknown>;
      const min = Number(priceObj.min || 0);
      const max = Number(priceObj.max || 0);

      if (!isNaN(min) && !isNaN(max) && min >= 0) {
        // バリデーションエラーを検出するため、無効な範囲でも返す
        return { min, max };
      }
    }

    return undefined;
  }

  /**
   * 詳細構造の検証
   * @param response 正規化されたレスポンス
   * @returns 検証結果
   */
  private validateDetailedStructure(response: AIRecommendationResponse): {
    issues: ResponseIssue[];
  } {
    const issues: ResponseIssue[] = [];

    try {
      AIRecommendationResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((zodError) => {
          issues.push({
            type: "ERROR",
            code: "VALIDATION_ERROR",
            message: `${zodError.path.join(".")}: ${zodError.message}`,
            context: { path: zodError.path, code: zodError.code },
          });
        });
      }
    }

    return { issues };
  }

  /**
   * 品質分析
   * @param response レスポンス
   * @returns 品質分析結果
   */
  private analyzeQuality(response: AIRecommendationResponse): {
    issues: ResponseIssue[];
  } {
    const issues: ResponseIssue[] = [];

    response.recommendations.forEach((item, index) => {
      // 商品名の品質チェック
      if (item.productName.length < 3) {
        issues.push({
          type: "WARNING",
          code: "SHORT_PRODUCT_NAME",
          message: `商品名が短すぎます[${index}]: "${item.productName}"`,
          context: { index, productName: item.productName },
        });
      }

      // 推薦理由の品質チェック
      if (item.reason.length < 20) {
        issues.push({
          type: "WARNING",
          code: "SHORT_REASON",
          message: `推薦理由が短すぎます[${index}]: "${item.reason}"`,
          context: { index, reason: item.reason },
        });
      }

      // スコアの妥当性チェック
      if (item.score < 0.1) {
        issues.push({
          type: "WARNING",
          code: "LOW_SCORE",
          message: `スコアが低すぎます[${index}]: ${item.score}`,
          context: { index, score: item.score },
        });
      }

      // 特徴の品質チェック
      if (item.features.length === 0) {
        issues.push({
          type: "WARNING",
          code: "NO_FEATURES",
          message: `特徴が設定されていません[${index}]`,
          context: { index },
        });
      }
    });

    // 重複チェック
    const productNames = response.recommendations.map((item) =>
      item.productName.toLowerCase()
    );
    const duplicates = productNames.filter(
      (name, index) => productNames.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
      issues.push({
        type: "WARNING",
        code: "DUPLICATE_PRODUCTS",
        message: `重複する商品名があります: ${duplicates.join(", ")}`,
        context: { duplicates },
      });
    }

    return { issues };
  }

  /**
   * メタデータ生成
   * @param response レスポンス
   * @param processingTime 処理時間
   * @returns メタデータ
   */
  private generateMetadata(
    response: AIRecommendationResponse,
    processingTime: number
  ): ResponseMetadata {
    const scores = response.recommendations.map((item) => item.score);
    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const scoreDistribution = {
      high: scores.filter((score) => score >= 0.8).length,
      medium: scores.filter((score) => score >= 0.5 && score < 0.8).length,
      low: scores.filter((score) => score < 0.5).length,
    };

    const hasIncompleteData = response.recommendations.some(
      (item) => !item.productName || !item.reason || item.features.length === 0
    );

    return {
      totalRecommendations: response.recommendations.length,
      averageScore,
      scoreDistribution,
      hasIncompleteData,
      processingTime,
    };
  }

  /**
   * 品質スコアの計算
   * @param response レスポンス
   * @param issues 問題点
   * @returns 品質スコア (0-1)
   */
  private calculateQualityScore(
    response: AIRecommendationResponse,
    issues: ResponseIssue[]
  ): number {
    let score = 1.0;

    // エラーによる減点
    const errors = issues.filter((issue) => issue.type === "ERROR");
    score -= errors.length * 0.3;

    // 警告による減点
    const warnings = issues.filter((issue) => issue.type === "WARNING");
    score -= warnings.length * 0.1;

    // レコメンド数による調整
    const recommendationCount = response.recommendations.length;
    if (recommendationCount < 3) {
      score -= 0.2;
    }

    // 平均スコアによる調整
    const averageScore =
      response.recommendations.reduce((sum, item) => sum + item.score, 0) /
      recommendationCount;
    score = score * 0.7 + averageScore * 0.3;

    return Math.max(0, Math.min(1, score));
  }
}

/**
 * デフォルトの AI Response Analyzer インスタンス
 */
export const aiResponseAnalyzer = new AIResponseAnalyzer();
