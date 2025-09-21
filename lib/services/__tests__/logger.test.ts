/**
 * ログとモニタリング機能のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  StructuredLogger,
  LogLevel,
  ConsoleLogOutput,
  PerformanceTracker,
  AIRecommendationLogger,
  MonitoringService,
  logUtils,
} from "../logger";

// コンソールログをモック
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal("console", mockConsole);

describe("ConsoleLogOutput", () => {
  let output: ConsoleLogOutput;

  beforeEach(() => {
    output = new ConsoleLogOutput();
    vi.clearAllMocks();
  });

  it("DEBUG レベルのログを正しく出力する", () => {
    const entry = {
      level: LogLevel.DEBUG,
      message: "Debug message",
      context: { sessionId: "test-session" },
      timestamp: "2024-01-01T00:00:00.000Z",
    };

    output.write(entry);

    expect(mockConsole.debug).toHaveBeenCalledWith(
      JSON.stringify(
        {
          level: LogLevel.DEBUG,
          message: "Debug message",
          timestamp: "2024-01-01T00:00:00.000Z",
          sessionId: "test-session",
        },
        null,
        2
      )
    );
  });

  it("ERROR レベルのログを正しく出力する", () => {
    const entry = {
      level: LogLevel.ERROR,
      message: "Error message",
      context: { sessionId: "test-session" },
      error: {
        message: "Test error",
        stack: "Error stack trace",
      },
      timestamp: "2024-01-01T00:00:00.000Z",
    };

    output.write(entry);

    expect(mockConsole.error).toHaveBeenCalledWith(
      JSON.stringify(
        {
          level: LogLevel.ERROR,
          message: "Error message",
          timestamp: "2024-01-01T00:00:00.000Z",
          sessionId: "test-session",
          error: {
            message: "Test error",
            stack: "Error stack trace",
          },
        },
        null,
        2
      )
    );
  });
});

describe("StructuredLogger", () => {
  let logger: StructuredLogger;
  let mockOutput: { write: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockOutput = { write: vi.fn() };
    logger = new StructuredLogger([mockOutput]);
  });

  it("デフォルトコンテキストを設定できる", () => {
    logger.setDefaultContext({ userId: "test-user" });
    logger.info("Test message", { sessionId: "test-session" });

    expect(mockOutput.write).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          userId: "test-user",
          sessionId: "test-session",
        }),
      })
    );
  });

  it("INFO レベルログを正しく記録する", () => {
    const metrics = {
      startTime: Date.now(),
      duration: 1000,
    };

    logger.info("Test info", { sessionId: "test-session" }, metrics, {
      extra: "data",
    });

    expect(mockOutput.write).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.INFO,
        message: "Test info",
        context: expect.objectContaining({
          sessionId: "test-session",
        }),
        metrics,
        extra: { extra: "data" },
      })
    );
  });

  it("ERROR レベルログを正しく記録する", () => {
    const error = new Error("Test error");
    error.stack = "Error stack trace";

    logger.error("Test error message", error, { sessionId: "test-session" });

    expect(mockOutput.write).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.ERROR,
        message: "Test error message",
        context: expect.objectContaining({
          sessionId: "test-session",
        }),
        error: expect.objectContaining({
          message: "Test error",
          stack: "Error stack trace",
        }),
      })
    );
  });

  it("カスタムエラープロパティを正しく抽出する", () => {
    const customError = new Error("Custom error") as Error & {
      code: string;
      category: string;
      isRetryable: boolean;
    };
    customError.code = "CUSTOM_ERROR";
    customError.category = "VALIDATION";
    customError.isRetryable = true;

    logger.error("Custom error message", customError);

    expect(mockOutput.write).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          errorCode: "CUSTOM_ERROR",
          errorCategory: "VALIDATION",
          isRetryable: true,
        }),
      })
    );
  });

  it("非Error オブジェクトを正しく処理する", () => {
    logger.error("String error", "This is a string error");

    expect(mockOutput.write).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: "This is a string error",
          originalError: "This is a string error",
        }),
      })
    );
  });
});

describe("PerformanceTracker", () => {
  let tracker: PerformanceTracker;

  beforeEach(() => {
    tracker = new PerformanceTracker();
  });

  it("開始時間を正しく記録する", () => {
    const metrics = tracker.getCurrent();

    expect(metrics.startTime).toBeDefined();
    expect(metrics.memoryUsage).toBeDefined();
  });

  it("AI リクエスト時間を記録できる", () => {
    tracker.recordAIRequest(5000);
    const metrics = tracker.getCurrent();

    expect(metrics.aiRequestDuration).toBe(5000);
  });

  it("マッピング時間を記録できる", () => {
    tracker.recordMapping(2000);
    const metrics = tracker.getCurrent();

    expect(metrics.mappingDuration).toBe(2000);
  });

  it("保存時間を記録できる", () => {
    tracker.recordSave(1000);
    const metrics = tracker.getCurrent();

    expect(metrics.saveDuration).toBe(1000);
  });

  it("DB クエリ数を累積記録できる", () => {
    tracker.recordDbQuery(3);
    tracker.recordDbQuery(2);
    const metrics = tracker.getCurrent();

    expect(metrics.dbQueryCount).toBe(5);
  });

  it("完了時のメトリクスを正しく計算する", () => {
    // 少し待機してから完了
    setTimeout(() => {
      const finalMetrics = tracker.finish();

      expect(finalMetrics.endTime).toBeDefined();
      expect(finalMetrics.duration).toBeGreaterThan(0);
      expect(
        finalMetrics.endTime! - finalMetrics.startTime
      ).toBeGreaterThanOrEqual(0);
    }, 10);
  });

  it("現在のメトリクスで duration を計算する", () => {
    const currentMetrics = tracker.getCurrent();

    expect(currentMetrics.duration).toBeGreaterThanOrEqual(0);
    expect(currentMetrics.memoryUsage).toBeDefined();
  });
});

describe("AIRecommendationLogger", () => {
  let logger: AIRecommendationLogger;
  let mockStructuredLogger: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockStructuredLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    logger = new AIRecommendationLogger(
      mockStructuredLogger as unknown as StructuredLogger
    );
  });

  it("パフォーマンストラッキングを開始できる", () => {
    const tracker = logger.startTracking();

    expect(tracker).toBeInstanceOf(PerformanceTracker);
  });

  it("レコメンド生成開始ログを記録する", () => {
    const context = { sessionId: "test-session", userId: "test-user" };

    logger.logRecommendationStart(context);

    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      "AIレコメンド生成開始",
      context,
      undefined
    );
  });

  it("AI リクエスト開始ログを記録する", () => {
    logger.startTracking();
    const context = { sessionId: "test-session" };

    logger.logAIRequestStart(context, 1500);

    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      "AI リクエスト開始",
      context,
      expect.any(Object),
      { promptLength: 1500 }
    );
  });

  it("AI リクエスト完了ログを記録し、トラッカーを更新する", () => {
    logger.startTracking();
    const context = { sessionId: "test-session" };

    logger.logAIRequestComplete(context, 5000, 10);

    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      "AI リクエスト完了",
      context,
      expect.objectContaining({
        aiRequestDuration: 5000,
      }),
      {
        aiRequestDuration: 5000,
        recommendationsCount: 10,
      }
    );
  });

  it("商品マッピング完了ログを記録する", () => {
    logger.startTracking();
    const context = { sessionId: "test-session" };
    const mappingStats = { successful: 8, failed: 2 };

    logger.logMappingComplete(context, 2000, mappingStats);

    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      "商品マッピング完了",
      context,
      expect.objectContaining({
        mappingDuration: 2000,
      }),
      {
        mappingDuration: 2000,
        mappingStats,
      }
    );
  });

  it("データベース保存完了ログを記録する", () => {
    logger.startTracking();
    const context = { sessionId: "test-session" };

    logger.logSaveComplete(context, 1000, 8);

    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      "データベース保存完了",
      context,
      expect.objectContaining({
        saveDuration: 1000,
      }),
      {
        saveDuration: 1000,
        savedCount: 8,
      }
    );
  });

  it("レコメンド生成完了ログを記録し、トラッカーを終了する", () => {
    logger.startTracking();
    const context = { sessionId: "test-session" };

    logger.logRecommendationComplete(context, 8, {
      categoryId: "test-category",
    });

    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      "AIレコメンド生成完了",
      context,
      expect.objectContaining({
        endTime: expect.any(Number),
        duration: expect.any(Number),
      }),
      {
        finalRecommendationsCount: 8,
        categoryId: "test-category",
      }
    );
  });

  it("エラーログを記録する", () => {
    logger.startTracking();
    const context = { sessionId: "test-session" };
    const error = new Error("Test error");

    logger.logError("エラーが発生しました", error, context, { extra: "info" });

    expect(mockStructuredLogger.error).toHaveBeenCalledWith(
      "エラーが発生しました",
      error,
      context,
      expect.objectContaining({
        extra: "info",
        metrics: expect.any(Object),
      })
    );
  });
});

describe("MonitoringService", () => {
  let monitoring: MonitoringService;

  beforeEach(() => {
    monitoring = new MonitoringService();
  });

  it("成功リクエストを記録する", () => {
    const metrics = {
      startTime: Date.now(),
      duration: 5000,
      aiRequestDuration: 3000,
      mappingDuration: 1500,
      saveDuration: 500,
    };

    monitoring.recordSuccess(metrics);
    const stats = monitoring.getStats();

    expect(stats.totalRequests).toBe(1);
    expect(stats.successfulRequests).toBe(1);
    expect(stats.failedRequests).toBe(0);
    expect(stats.averageResponseTime).toBe(5000);
    expect(stats.averageAIRequestTime).toBe(3000);
    expect(stats.averageMappingTime).toBe(1500);
    expect(stats.averageSaveTime).toBe(500);
  });

  it("エラーリクエストを記録する", () => {
    monitoring.recordError("VALIDATION", "INVALID_SESSION_ID");
    monitoring.recordError("EXTERNAL_SERVICE", "AI_SERVICE_UNAVAILABLE");
    monitoring.recordError("VALIDATION", "INVALID_SESSION_ID");

    const stats = monitoring.getStats();

    expect(stats.totalRequests).toBe(3);
    expect(stats.successfulRequests).toBe(0);
    expect(stats.failedRequests).toBe(3);
    expect(stats.errorsByCategory).toEqual({
      VALIDATION: 2,
      EXTERNAL_SERVICE: 1,
    });
    expect(stats.errorsByCode).toEqual({
      INVALID_SESSION_ID: 2,
      AI_SERVICE_UNAVAILABLE: 1,
    });
  });

  it("平均値を正しく計算する", () => {
    // 複数の成功リクエストを記録
    monitoring.recordSuccess({ startTime: Date.now(), duration: 1000 });
    monitoring.recordSuccess({ startTime: Date.now(), duration: 2000 });
    monitoring.recordSuccess({ startTime: Date.now(), duration: 3000 });

    const stats = monitoring.getStats();

    expect(stats.averageResponseTime).toBe(2000); // (1000 + 2000 + 3000) / 3
  });

  it("直近100件のみを保持する", () => {
    // 101件のリクエストを記録
    for (let i = 1; i <= 101; i++) {
      monitoring.recordSuccess({ startTime: Date.now(), duration: i * 100 });
    }

    const stats = monitoring.getStats();

    // 直近100件の平均: (200 + 300 + ... + 10100) / 100 = 5150
    expect(stats.averageResponseTime).toBe(5150);
  });

  it("統計情報をリセットできる", () => {
    monitoring.recordSuccess({ startTime: Date.now(), duration: 1000 });
    monitoring.recordError("VALIDATION", "INVALID_SESSION_ID");

    monitoring.resetStats();
    const stats = monitoring.getStats();

    expect(stats.totalRequests).toBe(0);
    expect(stats.successfulRequests).toBe(0);
    expect(stats.failedRequests).toBe(0);
    expect(stats.errorsByCategory).toEqual({});
    expect(stats.errorsByCode).toEqual({});
  });

  it("アラート条件を正しくチェックする", () => {
    // 高エラー率のシナリオ
    monitoring.recordError("VALIDATION", "INVALID_SESSION_ID");
    monitoring.recordError("VALIDATION", "INVALID_SESSION_ID");
    monitoring.recordSuccess({ startTime: Date.now(), duration: 1000 });

    let alerts = monitoring.checkAlerts();
    expect(alerts.highErrorRate).toBe(true); // 2/3 = 66% > 50%

    // 遅いレスポンスのシナリオ
    monitoring.resetStats();
    monitoring.recordSuccess({ startTime: Date.now(), duration: 35000 });

    alerts = monitoring.checkAlerts();
    expect(alerts.slowResponse).toBe(true); // 35000ms > 30000ms

    // AI サービス問題のシナリオ
    monitoring.resetStats();
    monitoring.recordSuccess({
      startTime: Date.now(),
      duration: 30000,
      aiRequestDuration: 28000,
    });

    alerts = monitoring.checkAlerts();
    expect(alerts.aiServiceIssue).toBe(true); // 28000ms > 25000ms
  });
});

describe("logUtils", () => {
  it("リクエストコンテキストを正しく作成する", () => {
    const context = logUtils.createRequestContext(
      "test-session",
      "test-user",
      "generateRecommendations",
      { categoryId: "test-category" }
    );

    expect(context).toEqual({
      sessionId: "test-session",
      userId: "test-user",
      operation: "generateRecommendations",
      categoryId: "test-category",
      timestamp: expect.any(String),
    });
  });

  it("エラーコンテキストを正しく作成する", () => {
    const context = logUtils.createErrorContext(
      "test-session",
      "test-user",
      "generateRecommendations",
      5000,
      { errorCode: "AI_SERVICE_UNAVAILABLE" }
    );

    expect(context).toEqual({
      sessionId: "test-session",
      userId: "test-user",
      operation: "generateRecommendations",
      duration: 5000,
      errorCode: "AI_SERVICE_UNAVAILABLE",
      timestamp: expect.any(String),
    });
  });

  it("パフォーマンスメトリクスを正しくフォーマットする", () => {
    const metrics = {
      startTime: Date.now(),
      duration: 5000,
      aiRequestDuration: 3000,
      mappingDuration: 1500,
      saveDuration: 500,
      dbQueryCount: 10,
      memoryUsage: {
        rss: 50 * 1024 * 1024, // 50MB
        heapUsed: 30 * 1024 * 1024, // 30MB
        heapTotal: 40 * 1024 * 1024, // 40MB
        external: 5 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024,
      },
    };

    const formatted = logUtils.formatMetrics(metrics);

    expect(formatted).toEqual({
      duration: 5000,
      aiRequestDuration: 3000,
      mappingDuration: 1500,
      saveDuration: 500,
      dbQueryCount: 10,
      memoryUsage: {
        rss: 50, // MB
        heapUsed: 30, // MB
        heapTotal: 40, // MB
      },
    });
  });

  it("メモリ使用量が未定義の場合を正しく処理する", () => {
    const metrics = {
      startTime: Date.now(),
      duration: 5000,
    };

    const formatted = logUtils.formatMetrics(metrics);

    expect(formatted.memoryUsage).toBeUndefined();
  });
});
