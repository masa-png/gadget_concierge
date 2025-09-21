/**
 * 包括的なエラーハンドリングシステム
 *
 * バリデーション、外部サービス、データベース、マッピングエラーの
 * 分類処理と適切なHTTPステータスコードとエラーメッセージの返却機能を提供します。
 *
 * 要件: 2.1, 2.2, 2.3, 2.5
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import {
  AIRecommendationError,
  AIRecommendationErrorCode,
  getHttpStatusCode,
  isRetryableError,
  isTemporaryError,
} from "@/lib/errors/ai-recommendation-error";
import { createErrorResponse } from "@/lib/api/middleware";
import { ErrorCodes } from "@/lib/validations/api";

/**
 * エラー分類の定義
 */
export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  DATABASE = "DATABASE",
  MAPPING = "MAPPING",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  RATE_LIMIT = "RATE_LIMIT",
  NETWORK = "NETWORK",
  CONFIGURATION = "CONFIGURATION",
  UNKNOWN = "UNKNOWN",
}

/**
 * エラー詳細情報の型定義
 */
export interface ErrorDetails {
  category: ErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  httpStatus: number;
  isRetryable: boolean;
  isTemporary: boolean;
  context?: Record<string, unknown>;
  originalError?: unknown;
}

/**
 * エラー分類器 - 様々なエラータイプを適切なカテゴリに分類
 */
export class ErrorClassifier {
  /**
   * エラーを分類してErrorDetailsを生成
   */
  static classify(
    error: unknown,
    context?: Record<string, unknown>
  ): ErrorDetails {
    // AIRecommendationError の場合
    if (error instanceof AIRecommendationError) {
      return this.classifyAIRecommendationError(error, context);
    }

    // Zod バリデーションエラーの場合
    if (error instanceof ZodError) {
      return this.classifyZodError(error, context);
    }

    // Prisma エラーの場合
    if (this.isPrismaError(error)) {
      return this.classifyPrismaError(error, context);
    }

    // HTTP エラーの場合
    if (this.isHttpError(error)) {
      return this.classifyHttpError(error, context);
    }

    // ネットワークエラーの場合
    if (this.isNetworkError(error)) {
      return this.classifyNetworkError(error, context);
    }

    // その他のエラー
    return this.classifyUnknownError(error, context);
  }

  /**
   * AIRecommendationError の分類
   */
  private static classifyAIRecommendationError(
    error: AIRecommendationError,
    context?: Record<string, unknown>
  ): ErrorDetails {
    const category = this.getAIErrorCategory(error.code);
    const httpStatus = getHttpStatusCode(error);
    const userMessage = this.getUserMessage(error.code);

    return {
      category,
      code: error.code,
      message: error.message,
      userMessage,
      httpStatus,
      isRetryable: isRetryableError(error),
      isTemporary: isTemporaryError(error),
      context: { ...error.context, ...context },
      originalError: error,
    };
  }

  /**
   * Zod バリデーションエラーの分類
   */
  private static classifyZodError(
    error: ZodError,
    context?: Record<string, unknown>
  ): ErrorDetails {
    const errorMessage = error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join(", ");

    return {
      category: ErrorCategory.VALIDATION,
      code: AIRecommendationErrorCode.INVALID_REQUEST_DATA,
      message: `バリデーションエラー: ${errorMessage}`,
      userMessage:
        "入力データに不正な値が含まれています。入力内容を確認してください。",
      httpStatus: 400,
      isRetryable: false,
      isTemporary: false,
      context: { zodErrors: error.errors, ...context },
      originalError: error,
    };
  }

  /**
   * Prisma エラーの分類
   */
  private static classifyPrismaError(
    error: unknown,
    context?: Record<string, unknown>
  ): ErrorDetails {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;

    switch (prismaError.code) {
      case "P2002": // Unique constraint violation
        return {
          category: ErrorCategory.DATABASE,
          code: AIRecommendationErrorCode.DUPLICATE_RECOMMENDATION,
          message: `一意制約違反: ${prismaError.message}`,
          userMessage: "既に同じデータが存在します。",
          httpStatus: 400,
          isRetryable: false,
          isTemporary: false,
          context: { prismaCode: prismaError.code, ...context },
          originalError: error,
        };

      case "P2025": // Record not found
        return {
          category: ErrorCategory.DATABASE,
          code: AIRecommendationErrorCode.DATA_NOT_FOUND,
          message: `レコードが見つかりません: ${prismaError.message}`,
          userMessage: "指定されたデータが見つかりません。",
          httpStatus: 404,
          isRetryable: false,
          isTemporary: false,
          context: { prismaCode: prismaError.code, ...context },
          originalError: error,
        };

      case "P1001": // Connection error
      case "P1002": // Connection timeout
        return {
          category: ErrorCategory.DATABASE,
          code: AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED,
          message: `データベース接続エラー: ${prismaError.message}`,
          userMessage:
            "データベースへの接続に問題があります。しばらく時間をおいて再試行してください。",
          httpStatus: 503,
          isRetryable: true,
          isTemporary: true,
          context: { prismaCode: prismaError.code, ...context },
          originalError: error,
        };

      default:
        return {
          category: ErrorCategory.DATABASE,
          code: AIRecommendationErrorCode.DATABASE_TRANSACTION_FAILED,
          message: `データベースエラー: ${prismaError.message}`,
          userMessage: "データベース処理中にエラーが発生しました。",
          httpStatus: 500,
          isRetryable: false,
          isTemporary: false,
          context: { prismaCode: prismaError.code, ...context },
          originalError: error,
        };
    }
  }

  /**
   * HTTP エラーの分類
   */
  private static classifyHttpError(
    error: unknown,
    context?: Record<string, unknown>
  ): ErrorDetails {
    const httpError = error as { status: number; message?: string };
    const status = httpError.status;

    switch (status) {
      case 401:
        return {
          category: ErrorCategory.AUTHENTICATION,
          code: AIRecommendationErrorCode.AI_AUTHENTICATION_FAILED,
          message: `認証エラー (${status}): ${
            httpError.message || "認証に失敗しました"
          }`,
          userMessage: "認証に失敗しました。ログインし直してください。",
          httpStatus: 401,
          isRetryable: false,
          isTemporary: false,
          context: { httpStatus: status, ...context },
          originalError: error,
        };

      case 403:
        return {
          category: ErrorCategory.AUTHORIZATION,
          code: AIRecommendationErrorCode.AI_AUTHENTICATION_FAILED,
          message: `認可エラー (${status}): ${
            httpError.message || "アクセスが拒否されました"
          }`,
          userMessage: "このリソースにアクセスする権限がありません。",
          httpStatus: 403,
          isRetryable: false,
          isTemporary: false,
          context: { httpStatus: status, ...context },
          originalError: error,
        };

      case 429:
        return {
          category: ErrorCategory.RATE_LIMIT,
          code: AIRecommendationErrorCode.AI_RATE_LIMIT_EXCEEDED,
          message: `レート制限エラー (${status}): ${
            httpError.message || "リクエスト数が上限を超えました"
          }`,
          userMessage:
            "リクエスト数が上限を超えました。しばらく時間をおいて再試行してください。",
          httpStatus: 429,
          isRetryable: true,
          isTemporary: true,
          context: { httpStatus: status, ...context },
          originalError: error,
        };

      case 502:
        return {
          category: ErrorCategory.EXTERNAL_SERVICE,
          code: AIRecommendationErrorCode.AI_RESPONSE_INVALID,
          message: `Bad Gateway (${status}): ${
            httpError.message || "外部サービスから無効なレスポンス"
          }`,
          userMessage: "外部サービスから無効なレスポンスを受信しました。",
          httpStatus: 502,
          isRetryable: true,
          isTemporary: true,
          context: { httpStatus: status, ...context },
          originalError: error,
        };

      case 503:
        return {
          category: ErrorCategory.EXTERNAL_SERVICE,
          code: AIRecommendationErrorCode.AI_SERVICE_UNAVAILABLE,
          message: `Service Unavailable (${status}): ${
            httpError.message || "サービスが利用できません"
          }`,
          userMessage:
            "サービスが一時的に利用できません。しばらく時間をおいて再試行してください。",
          httpStatus: 503,
          isRetryable: true,
          isTemporary: true,
          context: { httpStatus: status, ...context },
          originalError: error,
        };

      case 504:
        return {
          category: ErrorCategory.EXTERNAL_SERVICE,
          code: AIRecommendationErrorCode.AI_REQUEST_TIMEOUT,
          message: `Gateway Timeout (${status}): ${
            httpError.message || "リクエストがタイムアウトしました"
          }`,
          userMessage:
            "リクエストがタイムアウトしました。しばらく時間をおいて再試行してください。",
          httpStatus: 504,
          isRetryable: true,
          isTemporary: true,
          context: { httpStatus: status, ...context },
          originalError: error,
        };

      default:
        return {
          category: ErrorCategory.EXTERNAL_SERVICE,
          code: AIRecommendationErrorCode.UNKNOWN_ERROR,
          message: `HTTP エラー (${status}): ${
            httpError.message || "不明なHTTPエラー"
          }`,
          userMessage: "外部サービスでエラーが発生しました。",
          httpStatus: status >= 500 ? status : 500,
          isRetryable: status >= 500,
          isTemporary: status >= 500,
          context: { httpStatus: status, ...context },
          originalError: error,
        };
    }
  }

  /**
   * ネットワークエラーの分類
   */
  private static classifyNetworkError(
    error: unknown,
    context?: Record<string, unknown>
  ): ErrorDetails {
    const networkError = error as Error;

    return {
      category: ErrorCategory.NETWORK,
      code: AIRecommendationErrorCode.NETWORK_ERROR,
      message: `ネットワークエラー: ${networkError.message}`,
      userMessage:
        "ネットワーク接続に問題があります。接続を確認して再試行してください。",
      httpStatus: 503,
      isRetryable: true,
      isTemporary: true,
      context: { errorName: networkError.name, ...context },
      originalError: error,
    };
  }

  /**
   * 不明なエラーの分類
   */
  private static classifyUnknownError(
    error: unknown,
    context?: Record<string, unknown>
  ): ErrorDetails {
    const message = error instanceof Error ? error.message : String(error);

    return {
      category: ErrorCategory.UNKNOWN,
      code: AIRecommendationErrorCode.UNKNOWN_ERROR,
      message: `不明なエラー: ${message}`,
      userMessage:
        "予期しないエラーが発生しました。しばらく時間をおいて再試行してください。",
      httpStatus: 500,
      isRetryable: false,
      isTemporary: false,
      context: { errorType: typeof error, ...context },
      originalError: error,
    };
  }

  /**
   * AIRecommendationErrorCode からエラーカテゴリを取得
   */
  private static getAIErrorCategory(
    code: AIRecommendationErrorCode
  ): ErrorCategory {
    switch (code) {
      case AIRecommendationErrorCode.INVALID_SESSION_ID:
      case AIRecommendationErrorCode.SESSION_NOT_COMPLETED:
      case AIRecommendationErrorCode.DUPLICATE_RECOMMENDATION:
      case AIRecommendationErrorCode.INVALID_REQUEST_DATA:
        return ErrorCategory.VALIDATION;

      case AIRecommendationErrorCode.AI_SERVICE_UNAVAILABLE:
      case AIRecommendationErrorCode.AI_REQUEST_TIMEOUT:
      case AIRecommendationErrorCode.AI_RESPONSE_INVALID:
        return ErrorCategory.EXTERNAL_SERVICE;

      case AIRecommendationErrorCode.AI_AUTHENTICATION_FAILED:
        return ErrorCategory.AUTHENTICATION;

      case AIRecommendationErrorCode.AI_RATE_LIMIT_EXCEEDED:
        return ErrorCategory.RATE_LIMIT;

      case AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED:
      case AIRecommendationErrorCode.DATABASE_TRANSACTION_FAILED:
      case AIRecommendationErrorCode.DATA_NOT_FOUND:
        return ErrorCategory.DATABASE;

      case AIRecommendationErrorCode.PRODUCT_MAPPING_FAILED:
      case AIRecommendationErrorCode.INSUFFICIENT_CONFIDENCE:
      case AIRecommendationErrorCode.NO_MATCHING_PRODUCTS:
        return ErrorCategory.MAPPING;

      case AIRecommendationErrorCode.NETWORK_ERROR:
        return ErrorCategory.NETWORK;

      case AIRecommendationErrorCode.CONFIGURATION_ERROR:
        return ErrorCategory.CONFIGURATION;

      default:
        return ErrorCategory.UNKNOWN;
    }
  }

  /**
   * エラーコードに基づくユーザー向けメッセージを生成
   */
  private static getUserMessage(code: AIRecommendationErrorCode): string {
    switch (code) {
      case AIRecommendationErrorCode.INVALID_SESSION_ID:
        return "無効なセッションIDです。正しいセッションIDを指定してください。";
      case AIRecommendationErrorCode.SESSION_NOT_COMPLETED:
        return "アンケートが完了していません。アンケートを完了してからレコメンドを生成してください。";
      case AIRecommendationErrorCode.DUPLICATE_RECOMMENDATION:
        return "このセッションのレコメンドは既に生成されています。";
      case AIRecommendationErrorCode.INVALID_REQUEST_DATA:
        return "リクエストデータに不正な値が含まれています。入力内容を確認してください。";
      case AIRecommendationErrorCode.AI_SERVICE_UNAVAILABLE:
        return "AI サービスが一時的に利用できません。しばらく時間をおいて再試行してください。";
      case AIRecommendationErrorCode.AI_REQUEST_TIMEOUT:
        return "AI サービスの応答がタイムアウトしました。しばらく時間をおいて再試行してください。";
      case AIRecommendationErrorCode.AI_RESPONSE_INVALID:
        return "AI サービスから無効なレスポンスを受信しました。しばらく時間をおいて再試行してください。";
      case AIRecommendationErrorCode.AI_RATE_LIMIT_EXCEEDED:
        return "リクエスト数が上限を超えました。しばらく時間をおいて再試行してください。";
      case AIRecommendationErrorCode.AI_AUTHENTICATION_FAILED:
        return "認証に失敗しました。ログインし直してください。";
      case AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED:
        return "データベースへの接続に問題があります。しばらく時間をおいて再試行してください。";
      case AIRecommendationErrorCode.DATABASE_TRANSACTION_FAILED:
        return "データベース処理中にエラーが発生しました。しばらく時間をおいて再試行してください。";
      case AIRecommendationErrorCode.DATA_NOT_FOUND:
        return "指定されたデータが見つかりません。";
      case AIRecommendationErrorCode.PRODUCT_MAPPING_FAILED:
        return "商品マッピング処理中にエラーが発生しました。";
      case AIRecommendationErrorCode.INSUFFICIENT_CONFIDENCE:
        return "適切な商品が見つかりませんでした。条件を変更して再試行してください。";
      case AIRecommendationErrorCode.NO_MATCHING_PRODUCTS:
        return "条件に一致する商品が見つかりませんでした。";
      case AIRecommendationErrorCode.NETWORK_ERROR:
        return "ネットワーク接続に問題があります。接続を確認して再試行してください。";
      case AIRecommendationErrorCode.CONFIGURATION_ERROR:
        return "システム設定に問題があります。管理者にお問い合わせください。";
      default:
        return "予期しないエラーが発生しました。しばらく時間をおいて再試行してください。";
    }
  }

  /**
   * Prisma エラーかどうかを判定
   */
  private static isPrismaError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError ||
      error instanceof Prisma.PrismaClientRustPanicError ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientValidationError
    );
  }

  /**
   * HTTP エラーかどうかを判定
   */
  private static isHttpError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
    );
  }

  /**
   * ネットワークエラーかどうかを判定
   */
  private static isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    return (
      (error instanceof TypeError &&
        (error.message.includes("fetch") ||
          error.message.includes("network") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("ENOTFOUND") ||
          error.message.includes("ETIMEDOUT"))) ||
      error.name === "AbortError"
    );
  }
}

/**
 * エラーハンドラー - 統一されたエラー処理を提供
 */
export class ErrorHandler {
  /**
   * エラーを処理してNextResponseを生成
   */
  static handleError(
    error: unknown,
    context?: Record<string, unknown>
  ): NextResponse {
    const errorDetails = ErrorClassifier.classify(error, context);

    // ログ出力（詳細は logger.ts で実装）
    this.logError(errorDetails);

    // 適切なErrorCodeを決定
    const errorCode = this.mapToApiErrorCode(errorDetails.category);

    // NextResponse を生成
    return createErrorResponse(
      errorDetails.userMessage,
      errorDetails.httpStatus,
      errorCode
    );
  }

  /**
   * エラーカテゴリを API エラーコードにマッピング
   */
  private static mapToApiErrorCode(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return ErrorCodes.VALIDATION_ERROR;
      case ErrorCategory.AUTHENTICATION:
        return ErrorCodes.UNAUTHORIZED;
      case ErrorCategory.AUTHORIZATION:
        return ErrorCodes.FORBIDDEN;
      case ErrorCategory.DATABASE:
        if (category === ErrorCategory.DATABASE) {
          return ErrorCodes.NOT_FOUND; // データが見つからない場合
        }
        return ErrorCodes.INTERNAL_ERROR;
      case ErrorCategory.RATE_LIMIT:
        return ErrorCodes.RATE_LIMITED;
      case ErrorCategory.EXTERNAL_SERVICE:
      case ErrorCategory.MAPPING:
      case ErrorCategory.NETWORK:
      case ErrorCategory.CONFIGURATION:
      case ErrorCategory.UNKNOWN:
      default:
        return ErrorCodes.INTERNAL_ERROR;
    }
  }

  /**
   * エラーログ出力（logger.ts の構造化ログを使用）
   */
  private static logError(errorDetails: ErrorDetails): void {
    // コンソールログにフォールバック（循環依存を回避）
    console.error(`[ErrorHandler] ${errorDetails.category} エラー`, {
      code: errorDetails.code,
      message: errorDetails.message,
      httpStatus: errorDetails.httpStatus,
      isRetryable: errorDetails.isRetryable,
      isTemporary: errorDetails.isTemporary,
      context: errorDetails.context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * エラー詳細情報を取得（デバッグ用）
   */
  static getErrorDetails(
    error: unknown,
    context?: Record<string, unknown>
  ): ErrorDetails {
    return ErrorClassifier.classify(error, context);
  }

  /**
   * エラーがリトライ可能かどうかを判定
   */
  static isRetryable(error: unknown): boolean {
    const errorDetails = ErrorClassifier.classify(error);
    return errorDetails.isRetryable;
  }

  /**
   * エラーが一時的なものかどうかを判定
   */
  static isTemporary(error: unknown): boolean {
    const errorDetails = ErrorClassifier.classify(error);
    return errorDetails.isTemporary;
  }
}

/**
 * エラーハンドリングのユーティリティ関数
 */
export const errorHandler = {
  /**
   * 簡単なエラーハンドリング
   */
  handle: (error: unknown, context?: Record<string, unknown>) =>
    ErrorHandler.handleError(error, context),

  /**
   * エラー詳細取得
   */
  getDetails: (error: unknown, context?: Record<string, unknown>) =>
    ErrorHandler.getErrorDetails(error, context),

  /**
   * リトライ可能性判定
   */
  isRetryable: (error: unknown) => ErrorHandler.isRetryable(error),

  /**
   * 一時的エラー判定
   */
  isTemporary: (error: unknown) => ErrorHandler.isTemporary(error),
};
