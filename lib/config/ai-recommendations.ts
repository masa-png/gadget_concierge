/**
 * AI Recommendation Configuration
 *
 * This file contains configuration settings for the AI recommendation system,
 * including Mastra AI integration settings, recommendation parameters, and timeouts.
 */

import { z } from "zod";

/**
 * 環境変数のバリデーションスキーマ
 */
const envSchema = z.object({
  MASTRA_API_KEY: z.string().min(1, "MASTRA_API_KEY is required"),
  MASTRA_API_URL: z.string().url().optional().default("https://api.mastra.ai"),
  MASTRA_TIMEOUT: z.string().regex(/^\d+$/).optional().default("30000"),
  MAX_RECOMMENDATIONS: z.string().regex(/^\d+$/).optional().default("10"),
  MAPPING_CONFIDENCE_THRESHOLD: z
    .string()
    .regex(/^\d*\.?\d+$/)
    .optional()
    .default("0.7"),
  AI_TEMPERATURE: z
    .string()
    .regex(/^\d*\.?\d+$/)
    .optional()
    .default("0.3"),
});

/**
 * 設定値のバリデーションスキーマ
 */
const configSchema = z.object({
  maxRecommendations: z.number().int().min(1).max(50),
  mappingThreshold: z.number().min(0).max(1),
  aiTemperature: z.number().min(0).max(1),
  timeouts: z.object({
    aiRequest: z.number().int().min(1000).max(120000), // 1秒〜2分
    dbOperation: z.number().int().min(1000).max(60000), // 1秒〜1分
  }),
  mastra: z.object({
    apiKey: z.string().min(1),
    apiUrl: z.string().url(),
    timeout: z.number().int().min(1000).max(120000),
  }),
});

/**
 * 環境変数を解析して設定オブジェクトを作成
 */
function parseEnvironmentConfig() {
  // 環境変数の検証
  const env = envSchema.parse({
    MASTRA_API_KEY: process.env.MASTRA_API_KEY,
    MASTRA_API_URL: process.env.MASTRA_API_URL,
    MASTRA_TIMEOUT: process.env.MASTRA_TIMEOUT,
    MAX_RECOMMENDATIONS: process.env.MAX_RECOMMENDATIONS,
    MAPPING_CONFIDENCE_THRESHOLD: process.env.MAPPING_CONFIDENCE_THRESHOLD,
    AI_TEMPERATURE: process.env.AI_TEMPERATURE,
  });

  // 数値変換と設定オブジェクト作成
  const config = {
    maxRecommendations: parseInt(env.MAX_RECOMMENDATIONS),
    mappingThreshold: parseFloat(env.MAPPING_CONFIDENCE_THRESHOLD),
    aiTemperature: parseFloat(env.AI_TEMPERATURE),
    timeouts: {
      aiRequest: parseInt(env.MASTRA_TIMEOUT),
      dbOperation: 10000, // 固定値
    },
    mastra: {
      apiKey: env.MASTRA_API_KEY,
      apiUrl: env.MASTRA_API_URL,
      timeout: parseInt(env.MASTRA_TIMEOUT),
    },
  };

  // 設定値の検証
  return configSchema.parse(config);
}

/**
 * AI推奨システムの設定（遅延初期化）
 */
let _config: z.infer<typeof configSchema> | null = null;

/**
 * AI推奨システムの設定を取得（遅延初期化）
 */
export const AI_RECOMMENDATION_CONFIG = new Proxy(
  {} as z.infer<typeof configSchema>,
  {
    get(target, prop) {
      if (!_config) {
        _config = parseEnvironmentConfig();
      }
      return _config[prop as keyof typeof _config];
    },
  }
);

/**
 * 設定の初期化と検証を行う
 * アプリケーション起動時に呼び出して設定の妥当性を確認
 * @returns 初期化された設定オブジェクト
 * @throws ZodError 設定値が無効な場合
 */
export function initializeAIConfig() {
  try {
    const config = parseEnvironmentConfig();
    console.log("AI推奨システムの設定が正常に初期化されました");
    return config;
  } catch (error) {
    console.error("AI推奨システムの設定初期化に失敗しました:", error);
    throw error;
  }
}

/**
 * 設定値の妥当性を検証する（レガシー互換性のため）
 * @deprecated initializeAIConfig() を使用してください
 */
export function validateAIConfig(): void {
  try {
    parseEnvironmentConfig();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      throw new Error(`設定検証エラー: ${messages.join(", ")}`);
    }
    throw error;
  }
}

/**
 * 開発環境用の設定検証ヘルパー
 * 設定値の詳細情報を出力
 */
export function debugAIConfig(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.log("=== AI推奨システム設定情報 ===");
  console.log(`最大推奨数: ${AI_RECOMMENDATION_CONFIG.maxRecommendations}`);
  console.log(`マッピング閾値: ${AI_RECOMMENDATION_CONFIG.mappingThreshold}`);
  console.log(`AI温度設定: ${AI_RECOMMENDATION_CONFIG.aiTemperature}`);
  console.log(
    `AIリクエストタイムアウト: ${AI_RECOMMENDATION_CONFIG.timeouts.aiRequest}ms`
  );
  console.log(
    `DBオペレーションタイムアウト: ${AI_RECOMMENDATION_CONFIG.timeouts.dbOperation}ms`
  );
  console.log(`Mastra API URL: ${AI_RECOMMENDATION_CONFIG.mastra.apiUrl}`);
  console.log(
    `Mastra APIキー: ${
      AI_RECOMMENDATION_CONFIG.mastra.apiKey ? "設定済み" : "未設定"
    }`
  );
  console.log("===============================");
}

/**
 * 型定義
 */
export type AIRecommendationConfig = z.infer<typeof configSchema>;
export type AIEnvironmentConfig = z.infer<typeof envSchema>;
