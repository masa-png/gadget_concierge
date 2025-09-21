/**
 * AI推奨システム用のバリデーションスキーマ
 *
 * API リクエスト、レスポンス、内部データ構造の検証に使用します。
 */

import { z } from "zod";

/**
 * セッションIDのバリデーション
 */
export const sessionIdSchema = z
  .string()
  .min(1, "セッションIDは必須です")
  .max(50, "セッションIDが長すぎます")
  .regex(/^[a-zA-Z0-9_-]+$/, "セッションIDに無効な文字が含まれています");

/**
 * レコメンド生成リクエストのバリデーション
 */
export const generateRecommendationRequestSchema = z.object({
  sessionId: sessionIdSchema,
});

/**
 * AI推奨レスポンスのバリデーション
 */
export const aiRecommendationItemSchema = z.object({
  productName: z
    .string()
    .min(1, "商品名は必須です")
    .max(200, "商品名が長すぎます"),
  reason: z
    .string()
    .min(1, "推奨理由は必須です")
    .max(1000, "推奨理由が長すぎます"),
  score: z
    .number()
    .min(0, "スコアは0以上である必要があります")
    .max(1, "スコアは1以下である必要があります"),
  features: z
    .array(z.string().max(100, "特徴の説明が長すぎます"))
    .max(10, "特徴の数が多すぎます"),
  priceRange: z
    .object({
      min: z.number().min(0, "最小価格は0以上である必要があります"),
      max: z.number().min(0, "最大価格は0以上である必要があります"),
    })
    .refine(
      (data) => data.min <= data.max,
      "最小価格は最大価格以下である必要があります"
    )
    .optional(),
});

export const aiRecommendationResponseSchema = z.object({
  recommendations: z
    .array(aiRecommendationItemSchema)
    .min(1, "少なくとも1つの推奨が必要です")
    .max(50, "推奨数が多すぎます"),
});

/**
 * 商品マッピング結果のバリデーション
 */
export const productMatchSchema = z.object({
  productId: z
    .string()
    .min(1, "商品IDは必須です")
    .max(50, "商品IDが長すぎます"),
  confidence: z
    .number()
    .min(0, "信頼度は0以上である必要があります")
    .max(1, "信頼度は1以下である必要があります"),
  matchReasons: z
    .array(z.string().max(200, "マッチング理由が長すぎます"))
    .max(5, "マッチング理由の数が多すぎます"),
});

/**
 * レコメンドデータのバリデーション
 */
export const recommendationDataSchema = z.object({
  sessionId: sessionIdSchema,
  productId: z
    .string()
    .min(1, "商品IDは必須です")
    .max(50, "商品IDが長すぎます"),
  rank: z
    .number()
    .int()
    .min(1, "ランクは1以上である必要があります")
    .max(100, "ランクが大きすぎます"),
  score: z
    .number()
    .min(0, "スコアは0以上である必要があります")
    .max(1, "スコアは1以下である必要があります"),
  reason: z
    .string()
    .min(1, "推奨理由は必須です")
    .max(1000, "推奨理由が長すぎます"),
});

/**
 * 処理済み回答データのバリデーション
 */
export const processedAnswerSchema = z.object({
  questionId: z
    .string()
    .min(1, "質問IDは必須です")
    .max(50, "質問IDが長すぎます"),
  questionText: z
    .string()
    .min(1, "質問文は必須です")
    .max(1000, "質問文が長すぎます"),
  questionType: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "RANGE", "TEXT"]),
  answer: z.object({
    optionLabel: z.string().max(200, "選択肢ラベルが長すぎます").optional(),
    optionValue: z.string().max(200, "選択肢値が長すぎます").optional(),
    rangeValue: z
      .number()
      .min(0, "範囲値は0以上である必要があります")
      .max(100, "範囲値は100以下である必要があります")
      .optional(),
    textValue: z.string().max(2000, "テキスト値が長すぎます").optional(),
  }),
});

/**
 * プロンプトテンプレートのバリデーション
 */
export const promptTemplateSchema = z.object({
  categoryId: z
    .string()
    .min(1, "カテゴリIDは必須です")
    .max(50, "カテゴリIDが長すぎます"),
  systemPrompt: z
    .string()
    .min(1, "システムプロンプトは必須です")
    .max(5000, "システムプロンプトが長すぎます"),
  userPromptTemplate: z
    .string()
    .min(1, "ユーザープロンプトテンプレートは必須です")
    .max(10000, "ユーザープロンプトテンプレートが長すぎます"),
  outputFormat: z
    .string()
    .min(1, "出力フォーマットは必須です")
    .max(2000, "出力フォーマットが長すぎます"),
});

/**
 * AI推奨リクエストのバリデーション
 */
export const aiRecommendationRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "プロンプトは必須です")
    .max(20000, "プロンプトが長すぎます"),
  maxRecommendations: z
    .number()
    .int()
    .min(1, "最大推奨数は1以上である必要があります")
    .max(50, "最大推奨数は50以下である必要があります"),
  temperature: z
    .number()
    .min(0, "温度は0以上である必要があります")
    .max(1, "温度は1以下である必要があります")
    .optional(),
});

/**
 * API成功レスポンスのバリデーション
 */
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sessionId: sessionIdSchema,
    recommendationCount: z
      .number()
      .int()
      .min(0, "推奨数は0以上である必要があります"),
    message: z.string().optional(),
  }),
});

/**
 * APIエラーレスポンスのバリデーション
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string().min(1, "エラーコードは必須です"),
    message: z.string().min(1, "エラーメッセージは必須です"),
    details: z.record(z.unknown()).optional(),
  }),
});

/**
 * 型定義のエクスポート
 */
export type SessionId = z.infer<typeof sessionIdSchema>;
export type GenerateRecommendationRequest = z.infer<
  typeof generateRecommendationRequestSchema
>;
export type AIRecommendationItem = z.infer<typeof aiRecommendationItemSchema>;
export type AIRecommendationResponse = z.infer<
  typeof aiRecommendationResponseSchema
>;
export type ProductMatch = z.infer<typeof productMatchSchema>;
export type RecommendationData = z.infer<typeof recommendationDataSchema>;
export type ProcessedAnswer = z.infer<typeof processedAnswerSchema>;
export type PromptTemplate = z.infer<typeof promptTemplateSchema>;
export type AIRecommendationRequest = z.infer<
  typeof aiRecommendationRequestSchema
>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * バリデーションヘルパー関数
 */

/**
 * セッションIDを安全に検証する
 * @param sessionId 検証対象のセッションID
 * @returns 検証されたセッションID
 * @throws ZodError バリデーションエラー
 */
export function validateSessionId(sessionId: unknown): SessionId {
  return sessionIdSchema.parse(sessionId);
}

/**
 * AI推奨レスポンスを安全に検証する
 * @param response 検証対象のレスポンス
 * @returns 検証されたレスポンス
 * @throws ZodError バリデーションエラー
 */
export function validateAIRecommendationResponse(
  response: unknown
): AIRecommendationResponse {
  return aiRecommendationResponseSchema.parse(response);
}

/**
 * 処理済み回答データを安全に検証する
 * @param answers 検証対象の回答データ配列
 * @returns 検証された回答データ配列
 * @throws ZodError バリデーションエラー
 */
export function validateProcessedAnswers(answers: unknown): ProcessedAnswer[] {
  return z.array(processedAnswerSchema).parse(answers);
}
