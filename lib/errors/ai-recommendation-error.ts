/**
 * AI レコメンドシステム専用エラークラス
 *
 * AI サービス、商品マッピング、データベース操作などの
 * レコメンド生成プロセスで発生するエラーを管理します。
 */

export enum AIRecommendationErrorCode {
  // バリデーションエラー
  INVALID_SESSION_ID = "INVALID_SESSION_ID",
  SESSION_NOT_COMPLETED = "SESSION_NOT_COMPLETED",
  DUPLICATE_RECOMMENDATION = "DUPLICATE_RECOMMENDATION",
  INVALID_REQUEST_DATA = "INVALID_REQUEST_DATA",

  // AI サービスエラー
  AI_SERVICE_UNAVAILABLE = "AI_SERVICE_UNAVAILABLE",
  AI_REQUEST_TIMEOUT = "AI_REQUEST_TIMEOUT",
  AI_RESPONSE_INVALID = "AI_RESPONSE_INVALID",
  AI_RATE_LIMIT_EXCEEDED = "AI_RATE_LIMIT_EXCEEDED",
  AI_AUTHENTICATION_FAILED = "AI_AUTHENTICATION_FAILED",

  // データベースエラー
  DATABASE_CONNECTION_FAILED = "DATABASE_CONNECTION_FAILED",
  DATABASE_TRANSACTION_FAILED = "DATABASE_TRANSACTION_FAILED",
  DATA_NOT_FOUND = "DATA_NOT_FOUND",

  // 商品マッピングエラー
  PRODUCT_MAPPING_FAILED = "PRODUCT_MAPPING_FAILED",
  INSUFFICIENT_CONFIDENCE = "INSUFFICIENT_CONFIDENCE",
  NO_MATCHING_PRODUCTS = "NO_MATCHING_PRODUCTS",

  // 一般的なエラー
  NETWORK_ERROR = "NETWORK_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class AIRecommendationError extends Error {
  constructor(
    message: string,
    public code: AIRecommendationErrorCode,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AIRecommendationError";
  }
}

export const createAIRecommendationError = {
  // バリデーションエラー
  invalidSessionId: (sessionId: string, context?: Record<string, unknown>) =>
    new AIRecommendationError(
      `無効なセッションIDです: ${sessionId}`,
      AIRecommendationErrorCode.INVALID_SESSION_ID,
      { sessionId, ...context }
    ),

  sessionNotCompleted: (
    sessionId: string,
    status: string,
    context?: Record<string, unknown>
  ) =>
    new AIRecommendationError(
      `セッションが完了していません。現在のステータス: ${status}`,
      AIRecommendationErrorCode.SESSION_NOT_COMPLETED,
      { sessionId, status, ...context }
    ),

  duplicateRecommendation: (
    sessionId: string,
    context?: Record<string, unknown>
  ) =>
    new AIRecommendationError(
      `このセッションのレコメンドは既に生成されています: ${sessionId}`,
      AIRecommendationErrorCode.DUPLICATE_RECOMMENDATION,
      { sessionId, ...context }
    ),

  invalidRequestData: (message: string, context?: Record<string, unknown>) =>
    new AIRecommendationError(
      `リクエストデータが無効です: ${message}`,
      AIRecommendationErrorCode.INVALID_REQUEST_DATA,
      context
    ),

  // AI サービスエラー
  aiServiceUnavailable: (context?: Record<string, unknown>) =>
    new AIRecommendationError(
      "AI サービスが利用できません。しばらく時間をおいて再度お試しください。",
      AIRecommendationErrorCode.AI_SERVICE_UNAVAILABLE,
      context
    ),

  aiRequestTimeout: (timeout: number, context?: Record<string, unknown>) =>
    new AIRecommendationError(
      `AI リクエストがタイムアウトしました (${timeout}ms)`,
      AIRecommendationErrorCode.AI_REQUEST_TIMEOUT,
      { timeout, ...context }
    ),

  aiResponseInvalid: (reason: string, context?: Record<string, unknown>) =>
    new AIRecommendationError(
      `AI レスポンスが無効です: ${reason}`,
      AIRecommendationErrorCode.AI_RESPONSE_INVALID,
      { reason, ...context }
    ),

  aiRateLimitExceeded: (context?: Record<string, unknown>) =>
    new AIRecommendationError(
      "AI サービスのレート制限に達しました。しばらく待ってから再度お試しください。",
      AIRecommendationErrorCode.AI_RATE_LIMIT_EXCEEDED,
      context
    ),

  aiAuthenticationFailed: (context?: Record<string, unknown>) =>
    new AIRecommendationError(
      "AI サービスの認証に失敗しました。設定を確認してください。",
      AIRecommendationErrorCode.AI_AUTHENTICATION_FAILED,
      context
    ),

  // データベースエラー
  databaseConnectionFailed: (context?: Record<string, unknown>) =>
    new AIRecommendationError(
      "データベースへの接続に失敗しました",
      AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED,
      context
    ),

  databaseTransactionFailed: (context?: Record<string, unknown>) =>
    new AIRecommendationError(
      "データベーストランザクションが失敗しました",
      AIRecommendationErrorCode.DATABASE_TRANSACTION_FAILED,
      context
    ),

  dataNotFound: (
    resource: string,
    id: string,
    context?: Record<string, unknown>
  ) =>
    new AIRecommendationError(
      `${resource}が見つかりません: ${id}`,
      AIRecommendationErrorCode.DATA_NOT_FOUND,
      { resource, id, ...context }
    ),

  // 商品マッピングエラー
  productMappingFailed: (reason: string, context?: Record<string, unknown>) =>
    new AIRecommendationError(
      `商品マッピングに失敗しました: ${reason}`,
      AIRecommendationErrorCode.PRODUCT_MAPPING_FAILED,
      { reason, ...context }
    ),

  insufficientConfidence: (
    confidence: number,
    threshold: number,
    context?: Record<string, unknown>
  ) =>
    new AIRecommendationError(
      `マッチング信頼度が不十分です (${confidence} < ${threshold})`,
      AIRecommendationErrorCode.INSUFFICIENT_CONFIDENCE,
      { confidence, threshold, ...context }
    ),

  noMatchingProducts: (
    searchCriteria: Record<string, unknown>,
    context?: Record<string, unknown>
  ) =>
    new AIRecommendationError(
      "条件に一致する商品が見つかりませんでした",
      AIRecommendationErrorCode.NO_MATCHING_PRODUCTS,
      { searchCriteria, ...context }
    ),

  noValidRecommendations: (
    sessionId: string,
    context?: Record<string, unknown>
  ) =>
    new AIRecommendationError(
      `有効なレコメンドが生成されませんでした: ${sessionId}`,
      AIRecommendationErrorCode.NO_MATCHING_PRODUCTS,
      { sessionId, ...context }
    ),

  // 一般的なエラー
  networkError: (originalError: unknown, context?: Record<string, unknown>) =>
    new AIRecommendationError(
      "ネットワークエラーが発生しました。接続を確認してください。",
      AIRecommendationErrorCode.NETWORK_ERROR,
      { originalError, ...context }
    ),

  configurationError: (message: string, context?: Record<string, unknown>) =>
    new AIRecommendationError(
      `設定エラー: ${message}`,
      AIRecommendationErrorCode.CONFIGURATION_ERROR,
      context
    ),

  unknown: (originalError: unknown, context?: Record<string, unknown>) =>
    new AIRecommendationError(
      originalError instanceof Error
        ? originalError.message
        : "予期しないエラーが発生しました",
      AIRecommendationErrorCode.UNKNOWN_ERROR,
      { originalError, ...(context || {}) }
    ),
};

/**
 * エラーハンドリングユーティリティ関数
 */
export function handleAIRecommendationError(
  error: unknown,
  context?: Record<string, unknown>
): AIRecommendationError {
  if (error instanceof AIRecommendationError) {
    return error;
  }

  if (error instanceof Error) {
    // HTTP エラーの場合
    if ("status" in error) {
      const status = (error as { status: number }).status;
      switch (status) {
        case 401:
          return createAIRecommendationError.aiAuthenticationFailed({
            originalError: error,
            ...context,
          });
        case 429:
          return createAIRecommendationError.aiRateLimitExceeded({
            originalError: error,
            ...context,
          });
        case 503:
          return createAIRecommendationError.aiServiceUnavailable({
            originalError: error,
            ...context,
          });
        case 504:
          return createAIRecommendationError.aiRequestTimeout(30000, {
            originalError: error,
            ...context,
          });
        default:
          return createAIRecommendationError.unknown(error, context);
      }
    }

    // ネットワークエラーの場合
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return createAIRecommendationError.networkError(error, context);
    }

    // タイムアウトエラーの場合
    if (error.name === "AbortError" || error.message.includes("timeout")) {
      return createAIRecommendationError.aiRequestTimeout(30000, {
        originalError: error,
        ...context,
      });
    }

    return createAIRecommendationError.unknown(error, context);
  }

  return createAIRecommendationError.unknown(error, context);
}

/**
 * エラーがリトライ可能かどうかを判定
 */
export function isRetryableError(error: AIRecommendationError): boolean {
  return [
    AIRecommendationErrorCode.AI_SERVICE_UNAVAILABLE,
    AIRecommendationErrorCode.AI_REQUEST_TIMEOUT,
    AIRecommendationErrorCode.NETWORK_ERROR,
    AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED,
  ].includes(error.code);
}

/**
 * エラーが一時的なものかどうかを判定
 */
export function isTemporaryError(error: AIRecommendationError): boolean {
  return [
    AIRecommendationErrorCode.AI_SERVICE_UNAVAILABLE,
    AIRecommendationErrorCode.AI_REQUEST_TIMEOUT,
    AIRecommendationErrorCode.AI_RATE_LIMIT_EXCEEDED,
    AIRecommendationErrorCode.NETWORK_ERROR,
    AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED,
  ].includes(error.code);
}

/**
 * HTTP ステータスコードを取得
 */
export function getHttpStatusCode(error: AIRecommendationError): number {
  switch (error.code) {
    case AIRecommendationErrorCode.INVALID_SESSION_ID:
    case AIRecommendationErrorCode.SESSION_NOT_COMPLETED:
    case AIRecommendationErrorCode.DUPLICATE_RECOMMENDATION:
    case AIRecommendationErrorCode.INVALID_REQUEST_DATA:
      return 400;

    case AIRecommendationErrorCode.AI_AUTHENTICATION_FAILED:
      return 401;

    case AIRecommendationErrorCode.DATA_NOT_FOUND:
      return 404;

    case AIRecommendationErrorCode.AI_RATE_LIMIT_EXCEEDED:
      return 429;

    case AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED:
      return 503;

    case AIRecommendationErrorCode.DATABASE_TRANSACTION_FAILED:
    case AIRecommendationErrorCode.PRODUCT_MAPPING_FAILED:
    case AIRecommendationErrorCode.CONFIGURATION_ERROR:
    case AIRecommendationErrorCode.UNKNOWN_ERROR:
      return 500;

    case AIRecommendationErrorCode.AI_RESPONSE_INVALID:
      return 502;

    case AIRecommendationErrorCode.AI_SERVICE_UNAVAILABLE:
      return 503;

    case AIRecommendationErrorCode.AI_REQUEST_TIMEOUT:
      return 504;

    default:
      return 500;
  }
}
