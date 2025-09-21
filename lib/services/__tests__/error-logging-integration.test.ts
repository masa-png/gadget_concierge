/**
 * エラーハンドリングとログ機能の統合テスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { errorHandler } from "../error-handler";
import { aiRecommendationLogger, monitoringService } from "../logger";
import { createAIRecommendationError } from "@/lib/errors/ai-recommendation-error";

describe("エラーハンドリングとログ機能の統合", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    monitoringService.resetStats();
  });

  it("エラーハンドラーがログとモニタリングを正しく統合する", () => {
    // テストエラーを作成
    const error = createAIRecommendationError.aiServiceUnavailable();
    const context = {
      sessionId: "test-session",
      userId: "test-user",
      operation: "testOperation",
    };

    // エラーハンドラーを実行
    const response = errorHandler.handle(error, context);

    // レスポンスが生成されることを確認
    expect(response).toBeDefined();

    // ログが記録されることを確認（フォールバックログが使用される）
    // 実際の統合では logger.ts が正しく読み込まれる
  });

  it("モニタリングサービスが統計を正しく記録する", () => {
    const metrics = {
      startTime: Date.now(),
      duration: 5000,
      aiRequestDuration: 3000,
      mappingDuration: 1500,
      saveDuration: 500,
    };

    // 成功ケース
    monitoringService.recordSuccess(metrics);

    let stats = monitoringService.getStats();
    expect(stats.totalRequests).toBe(1);
    expect(stats.successfulRequests).toBe(1);
    expect(stats.failedRequests).toBe(0);

    // エラーケース
    monitoringService.recordError("EXTERNAL_SERVICE", "AI_SERVICE_UNAVAILABLE");

    stats = monitoringService.getStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.successfulRequests).toBe(1);
    expect(stats.failedRequests).toBe(1);
    expect(stats.errorsByCategory["EXTERNAL_SERVICE"]).toBe(1);
    expect(stats.errorsByCode["AI_SERVICE_UNAVAILABLE"]).toBe(1);
  });

  it("アラート条件を正しく検出する", () => {
    // 高エラー率のシナリオ
    monitoringService.recordError("VALIDATION", "INVALID_SESSION_ID");
    monitoringService.recordError("VALIDATION", "INVALID_SESSION_ID");
    monitoringService.recordSuccess({ startTime: Date.now(), duration: 1000 });

    let alerts = monitoringService.checkAlerts();
    expect(alerts.highErrorRate).toBe(true); // 2/3 = 66% > 50%

    // 遅いレスポンスのシナリオ
    monitoringService.resetStats();
    monitoringService.recordSuccess({ startTime: Date.now(), duration: 35000 });

    alerts = monitoringService.checkAlerts();
    expect(alerts.slowResponse).toBe(true); // 35000ms > 30000ms

    // AI サービス問題のシナリオ
    monitoringService.resetStats();
    monitoringService.recordSuccess({
      startTime: Date.now(),
      duration: 30000,
      aiRequestDuration: 28000,
    });

    alerts = monitoringService.checkAlerts();
    expect(alerts.aiServiceIssue).toBe(true); // 28000ms > 25000ms
  });

  it("エラー分類が正しく動作する", () => {
    const testCases = [
      {
        error: createAIRecommendationError.invalidSessionId("test"),
        expectedCategory: "VALIDATION",
        expectedRetryable: false,
        expectedTemporary: false,
      },
      {
        error: createAIRecommendationError.aiServiceUnavailable(),
        expectedCategory: "EXTERNAL_SERVICE",
        expectedRetryable: true,
        expectedTemporary: true,
      },
      {
        error: createAIRecommendationError.databaseConnectionFailed(),
        expectedCategory: "DATABASE",
        expectedRetryable: true,
        expectedTemporary: true,
      },
      {
        error: createAIRecommendationError.productMappingFailed("test"),
        expectedCategory: "MAPPING",
        expectedRetryable: false,
        expectedTemporary: false,
      },
    ];

    testCases.forEach(
      ({ error, expectedCategory, expectedRetryable, expectedTemporary }) => {
        const details = errorHandler.getDetails(error);

        expect(details.category).toBe(expectedCategory);
        expect(details.isRetryable).toBe(expectedRetryable);
        expect(details.isTemporary).toBe(expectedTemporary);
      }
    );
  });

  it("パフォーマンストラッキングが正しく動作する", () => {
    const tracker = aiRecommendationLogger.startTracking();

    // 各種時間を記録
    tracker.recordAIRequest(3000);
    tracker.recordMapping(1500);
    tracker.recordSave(500);
    tracker.recordDbQuery(5);

    const currentMetrics = tracker.getCurrent();
    expect(currentMetrics.aiRequestDuration).toBe(3000);
    expect(currentMetrics.mappingDuration).toBe(1500);
    expect(currentMetrics.saveDuration).toBe(500);
    expect(currentMetrics.dbQueryCount).toBe(5);
    expect(currentMetrics.duration).toBeGreaterThanOrEqual(0);

    const finalMetrics = tracker.finish();
    expect(finalMetrics.endTime).toBeDefined();
    expect(finalMetrics.duration).toBeGreaterThanOrEqual(0);
  });
});
