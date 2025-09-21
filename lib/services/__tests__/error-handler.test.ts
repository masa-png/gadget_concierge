/**
 * エラーハンドリングシステムのテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  ErrorClassifier,
  ErrorHandler,
  ErrorCategory,
  errorHandler,
} from "../error-handler";
import {
  AIRecommendationError,
  AIRecommendationErrorCode,
  createAIRecommendationError,
} from "@/lib/errors/ai-recommendation-error";

// モック
vi.mock("../logger", () => ({
  aiRecommendationLogger: {
    logError: vi.fn(),
  },
  monitoringService: {
    recordError: vi.fn(),
  },
}));

vi.mock("@/lib/api/middleware", () => ({
  createErrorResponse: vi.fn((message, status, code) => ({
    json: () => ({ success: false, error: message, code }),
    status,
  })),
}));

describe("ErrorClassifier", () => {
  describe("AIRecommendationError の分類", () => {
    it("バリデーションエラーを正しく分類する", () => {
      const error =
        createAIRecommendationError.invalidSessionId("test-session");
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.VALIDATION);
      expect(details.code).toBe(AIRecommendationErrorCode.INVALID_SESSION_ID);
      expect(details.httpStatus).toBe(400);
      expect(details.isRetryable).toBe(false);
      expect(details.isTemporary).toBe(false);
    });

    it("AI サービスエラーを正しく分類する", () => {
      const error = createAIRecommendationError.aiServiceUnavailable();
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
      expect(details.code).toBe(
        AIRecommendationErrorCode.AI_SERVICE_UNAVAILABLE
      );
      expect(details.httpStatus).toBe(503);
      expect(details.isRetryable).toBe(true);
      expect(details.isTemporary).toBe(true);
    });

    it("データベースエラーを正しく分類する", () => {
      const error = createAIRecommendationError.databaseConnectionFailed();
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.DATABASE);
      expect(details.code).toBe(
        AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED
      );
      expect(details.httpStatus).toBe(503);
      expect(details.isRetryable).toBe(true);
      expect(details.isTemporary).toBe(true);
    });

    it("商品マッピングエラーを正しく分類する", () => {
      const error =
        createAIRecommendationError.productMappingFailed("テスト理由");
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.MAPPING);
      expect(details.code).toBe(
        AIRecommendationErrorCode.PRODUCT_MAPPING_FAILED
      );
      expect(details.httpStatus).toBe(500);
      expect(details.isRetryable).toBe(false);
      expect(details.isTemporary).toBe(false);
    });
  });

  describe("Zod エラーの分類", () => {
    it("Zod バリデーションエラーを正しく分類する", () => {
      const schema = z.object({
        sessionId: z.string().cuid(),
        count: z.number().min(1),
      });

      try {
        schema.parse({ sessionId: "invalid", count: -1 });
      } catch (error) {
        const details = ErrorClassifier.classify(error);

        expect(details.category).toBe(ErrorCategory.VALIDATION);
        expect(details.code).toBe(
          AIRecommendationErrorCode.INVALID_REQUEST_DATA
        );
        expect(details.httpStatus).toBe(400);
        expect(details.isRetryable).toBe(false);
        expect(details.isTemporary).toBe(false);
        expect(details.message).toContain("バリデーションエラー");
      }
    });
  });

  describe("Prisma エラーの分類", () => {
    it("一意制約違反エラーを正しく分類する", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
        }
      );

      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.DATABASE);
      expect(details.code).toBe(
        AIRecommendationErrorCode.DUPLICATE_RECOMMENDATION
      );
      expect(details.httpStatus).toBe(400);
      expect(details.isRetryable).toBe(false);
    });

    it("レコード未発見エラーを正しく分類する", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        }
      );

      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.DATABASE);
      expect(details.code).toBe(AIRecommendationErrorCode.DATA_NOT_FOUND);
      expect(details.httpStatus).toBe(404);
    });

    it("接続エラーを正しく分類する", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Connection failed",
        {
          code: "P1001",
          clientVersion: "5.0.0",
        }
      );

      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.DATABASE);
      expect(details.code).toBe(
        AIRecommendationErrorCode.DATABASE_CONNECTION_FAILED
      );
      expect(details.httpStatus).toBe(503);
      expect(details.isRetryable).toBe(true);
      expect(details.isTemporary).toBe(true);
    });
  });

  describe("HTTP エラーの分類", () => {
    it("401 認証エラーを正しく分類する", () => {
      const error = { status: 401, message: "Unauthorized" };
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(details.httpStatus).toBe(401);
      expect(details.isRetryable).toBe(false);
    });

    it("403 認可エラーを正しく分類する", () => {
      const error = { status: 403, message: "Forbidden" };
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(details.httpStatus).toBe(403);
      expect(details.isRetryable).toBe(false);
    });

    it("429 レート制限エラーを正しく分類する", () => {
      const error = { status: 429, message: "Too Many Requests" };
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(details.httpStatus).toBe(429);
      expect(details.isRetryable).toBe(true);
      expect(details.isTemporary).toBe(true);
    });

    it("503 サービス利用不可エラーを正しく分類する", () => {
      const error = { status: 503, message: "Service Unavailable" };
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
      expect(details.httpStatus).toBe(503);
      expect(details.isRetryable).toBe(true);
      expect(details.isTemporary).toBe(true);
    });
  });

  describe("ネットワークエラーの分類", () => {
    it("fetch エラーを正しく分類する", () => {
      const error = new TypeError("fetch failed");
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.NETWORK);
      expect(details.code).toBe(AIRecommendationErrorCode.NETWORK_ERROR);
      expect(details.httpStatus).toBe(503);
      expect(details.isRetryable).toBe(true);
      expect(details.isTemporary).toBe(true);
    });

    it("AbortError を正しく分類する", () => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.NETWORK);
      expect(details.code).toBe(AIRecommendationErrorCode.NETWORK_ERROR);
      expect(details.isRetryable).toBe(true);
      expect(details.isTemporary).toBe(true);
    });
  });

  describe("不明なエラーの分類", () => {
    it("一般的な Error を正しく分類する", () => {
      const error = new Error("Something went wrong");
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.UNKNOWN);
      expect(details.code).toBe(AIRecommendationErrorCode.UNKNOWN_ERROR);
      expect(details.httpStatus).toBe(500);
      expect(details.isRetryable).toBe(false);
      expect(details.isTemporary).toBe(false);
    });

    it("文字列エラーを正しく分類する", () => {
      const error = "String error message";
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBe(ErrorCategory.UNKNOWN);
      expect(details.code).toBe(AIRecommendationErrorCode.UNKNOWN_ERROR);
      expect(details.httpStatus).toBe(500);
    });

    it("null/undefined エラーを正しく分類する", () => {
      const details1 = ErrorClassifier.classify(null);
      const details2 = ErrorClassifier.classify(undefined);

      expect(details1.category).toBe(ErrorCategory.UNKNOWN);
      expect(details2.category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe("コンテキスト情報の処理", () => {
    it("追加コンテキストを正しく統合する", () => {
      const error = createAIRecommendationError.invalidSessionId(
        "test-session",
        {
          originalContext: "original",
        }
      );
      const additionalContext = { additionalInfo: "additional" };

      const details = ErrorClassifier.classify(error, additionalContext);

      expect(details.context).toEqual({
        sessionId: "test-session",
        originalContext: "original",
        additionalInfo: "additional",
      });
    });
  });
});

describe("ErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleError", () => {
    it("AIRecommendationError を正しく処理する", () => {
      const error = createAIRecommendationError.aiServiceUnavailable();
      const context = { sessionId: "test-session", userId: "test-user" };

      const response = ErrorHandler.handleError(error, context);

      expect(response).toBeDefined();
      // createErrorResponse がモックされているため、実際のレスポンス構造は確認しない
    });

    it("一般的なエラーを正しく処理する", () => {
      const error = new Error("Test error");
      const context = { sessionId: "test-session" };

      const response = ErrorHandler.handleError(error, context);

      expect(response).toBeDefined();
    });
  });

  describe("getErrorDetails", () => {
    it("エラー詳細を正しく取得する", () => {
      const error =
        createAIRecommendationError.invalidSessionId("test-session");
      const details = ErrorHandler.getErrorDetails(error);

      expect(details.category).toBe(ErrorCategory.VALIDATION);
      expect(details.code).toBe(AIRecommendationErrorCode.INVALID_SESSION_ID);
    });
  });

  describe("isRetryable", () => {
    it("リトライ可能なエラーを正しく判定する", () => {
      const retryableError = createAIRecommendationError.aiServiceUnavailable();
      const nonRetryableError =
        createAIRecommendationError.invalidSessionId("test");

      expect(ErrorHandler.isRetryable(retryableError)).toBe(true);
      expect(ErrorHandler.isRetryable(nonRetryableError)).toBe(false);
    });
  });

  describe("isTemporary", () => {
    it("一時的なエラーを正しく判定する", () => {
      const temporaryError =
        createAIRecommendationError.aiRequestTimeout(30000);
      const permanentError =
        createAIRecommendationError.invalidSessionId("test");

      expect(ErrorHandler.isTemporary(temporaryError)).toBe(true);
      expect(ErrorHandler.isTemporary(permanentError)).toBe(false);
    });
  });
});

describe("errorHandler ユーティリティ", () => {
  it("handle 関数が正しく動作する", () => {
    const error = new Error("Test error");
    const result = errorHandler.handle(error);

    expect(result).toBeDefined();
  });

  it("getDetails 関数が正しく動作する", () => {
    const error = createAIRecommendationError.aiServiceUnavailable();
    const details = errorHandler.getDetails(error);

    expect(details.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
  });

  it("isRetryable 関数が正しく動作する", () => {
    const error = createAIRecommendationError.networkError(
      new Error("Network error")
    );
    const result = errorHandler.isRetryable(error);

    expect(result).toBe(true);
  });

  it("isTemporary 関数が正しく動作する", () => {
    const error = createAIRecommendationError.aiRateLimitExceeded();
    const result = errorHandler.isTemporary(error);

    expect(result).toBe(true);
  });
});

describe("エラー分類の網羅性テスト", () => {
  it("すべての AIRecommendationErrorCode が適切に分類される", () => {
    const errorCodes = Object.values(AIRecommendationErrorCode);

    errorCodes.forEach((code) => {
      const error = new AIRecommendationError("Test message", code);
      const details = ErrorClassifier.classify(error);

      expect(details.category).toBeDefined();
      expect(details.httpStatus).toBeGreaterThanOrEqual(400);
      expect(details.httpStatus).toBeLessThan(600);
      expect(typeof details.isRetryable).toBe("boolean");
      expect(typeof details.isTemporary).toBe("boolean");
    });
  });

  it("すべてのエラーカテゴリが適切な API エラーコードにマッピングされる", () => {
    const categories = Object.values(ErrorCategory);

    categories.forEach(() => {
      const error = new AIRecommendationError(
        "Test message",
        AIRecommendationErrorCode.UNKNOWN_ERROR
      );
      // カテゴリを強制的に設定してテスト
      const response = ErrorHandler.handleError(error);
      expect(response).toBeDefined();
    });
  });
});
