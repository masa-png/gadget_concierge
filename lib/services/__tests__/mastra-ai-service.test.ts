/**
 * Mastra AI Service のテスト
 */

import { describe, it, expect, beforeEach, vi, Mock } from "vitest";
import {
  MastraAIServiceImpl,
  createMastraAIService,
} from "../mastra-ai-service";
import { AIRecommendationRequest } from "../../types/ai-recommendations";

// モック設定
vi.mock("../mastra-client", () => ({
  getMastraClient: vi.fn(() => ({})),
}));

vi.mock("../../config/ai-recommendations", () => ({
  AI_RECOMMENDATION_CONFIG: {
    maxRecommendations: 10,
    mappingThreshold: 0.7,
    aiTemperature: 0.3,
    timeouts: {
      aiRequest: 30000,
      dbOperation: 10000,
    },
    mastra: {
      apiKey: "test-api-key",
      apiUrl: "https://api.mastra.ai",
      timeout: 30000,
    },
  },
}));

vi.mock("../ai-response-analyzer", () => ({
  aiResponseAnalyzer: {
    analyzeResponse: vi.fn(),
  },
}));

// fetch のモック
global.fetch = vi.fn();

describe("MastraAIServiceImpl", () => {
  let service: MastraAIServiceImpl;
  let mockFetch: Mock;

  beforeEach(() => {
    service = new MastraAIServiceImpl();
    mockFetch = global.fetch as Mock;
    vi.clearAllMocks();
  });

  describe("generateRecommendations", () => {
    const validRequest: AIRecommendationRequest = {
      prompt: "スマートフォンのレコメンドを生成してください",
      maxRecommendations: 5,
      temperature: 0.3,
    };

    it("有効なリクエストで正常にレコメンドを生成する", async () => {
      // fetch のモック設定
      const mockResponse = {
        recommendations: [
          {
            productName: "iPhone 15 Pro",
            reason: "高性能なカメラと処理能力を持つスマートフォンです。",
            score: 0.9,
            features: ["高性能カメラ", "A17 Pro チップ"],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // レスポンス分析のモック
      const { aiResponseAnalyzer } = await import("../ai-response-analyzer");
      (aiResponseAnalyzer.analyzeResponse as Mock).mockResolvedValueOnce({
        isValid: true,
        normalizedResponse: mockResponse,
        qualityScore: 0.9,
        issues: [],
        metadata: {
          totalRecommendations: 1,
          averageScore: 0.9,
          scoreDistribution: { high: 1, medium: 0, low: 0 },
          hasIncompleteData: false,
          processingTime: 100,
        },
      });

      const result = await service.generateRecommendations(validRequest);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mastra.ai",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-api-key",
          },
          body: JSON.stringify({
            prompt: validRequest.prompt,
            max_recommendations: validRequest.maxRecommendations,
            temperature: validRequest.temperature,
          }),
        })
      );
    });

    it("空のプロンプトでバリデーションエラーを投げる", async () => {
      const invalidRequest = {
        ...validRequest,
        prompt: "",
      };

      await expect(
        service.generateRecommendations(invalidRequest)
      ).rejects.toThrow("プロンプトが空です");
    });

    it("長すぎるプロンプトでバリデーションエラーを投げる", async () => {
      const invalidRequest = {
        ...validRequest,
        prompt: "a".repeat(10001), // 10,000文字を超える
      };

      await expect(
        service.generateRecommendations(invalidRequest)
      ).rejects.toThrow("プロンプトが長すぎます");
    });

    it("無効なmaxRecommendationsでバリデーションエラーを投げる", async () => {
      const invalidRequest = {
        ...validRequest,
        maxRecommendations: 0,
      };

      await expect(
        service.generateRecommendations(invalidRequest)
      ).rejects.toThrow(
        "maxRecommendations は 1-50 の範囲である必要があります"
      );
    });

    it("無効なtemperatureでバリデーションエラーを投げる", async () => {
      const invalidRequest = {
        ...validRequest,
        temperature: 1.5,
      };

      await expect(
        service.generateRecommendations(invalidRequest)
      ).rejects.toThrow("temperature は 0-1 の範囲である必要があります");
    });

    it("401エラーで認証失敗エラーを投げる", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(
        service.generateRecommendations(validRequest)
      ).rejects.toThrow();
    });

    it("429エラーでレート制限エラーを投げる", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve("Rate limit exceeded"),
      });

      await expect(
        service.generateRecommendations(validRequest)
      ).rejects.toThrow();
    });

    it("503エラーでサービス利用不可エラーを投げる", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service unavailable"),
      });

      await expect(
        service.generateRecommendations(validRequest)
      ).rejects.toThrow();
    });

    it("ネットワークエラーを適切に処理する", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(
        service.generateRecommendations(validRequest)
      ).rejects.toThrow();
    });

    it("無効なレスポンス分析結果でエラーを投げる", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: "response" }),
      });

      // 無効な分析結果のモック
      const { aiResponseAnalyzer } = await import("../ai-response-analyzer");
      (aiResponseAnalyzer.analyzeResponse as Mock).mockResolvedValueOnce({
        isValid: false,
        normalizedResponse: { recommendations: [] },
        qualityScore: 0,
        issues: [
          {
            type: "ERROR",
            code: "INVALID_STRUCTURE",
            message: "レスポンス構造が無効です",
          },
        ],
        metadata: {
          totalRecommendations: 0,
          averageScore: 0,
          scoreDistribution: { high: 0, medium: 0, low: 0 },
          hasIncompleteData: true,
          processingTime: 50,
        },
      });

      await expect(
        service.generateRecommendations(validRequest)
      ).rejects.toThrow("レスポンス検証に失敗しました");
    });

    it("低品質レスポンスで警告ログを出力する", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            recommendations: [
              {
                productName: "低品質商品",
                reason: "短い理由",
                score: 0.3,
                features: [],
              },
            ],
          }),
      });

      // 低品質な分析結果のモック
      const { aiResponseAnalyzer } = await import("../ai-response-analyzer");
      (aiResponseAnalyzer.analyzeResponse as Mock).mockResolvedValueOnce({
        isValid: true,
        normalizedResponse: {
          recommendations: [
            {
              productName: "低品質商品",
              reason: "短い理由",
              score: 0.3,
              features: [],
            },
          ],
        },
        qualityScore: 0.5, // 低品質スコア
        issues: [
          {
            type: "WARNING",
            code: "LOW_QUALITY",
            message: "品質が低いです",
          },
        ],
        metadata: {
          totalRecommendations: 1,
          averageScore: 0.3,
          scoreDistribution: { high: 0, medium: 0, low: 1 },
          hasIncompleteData: true,
          processingTime: 100,
        },
      });

      await service.generateRecommendations(validRequest);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("AI レスポンスの品質スコアが低いです"),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("validateResponse", () => {
    it("有効なレスポンスでtrueを返す", () => {
      const validResponse = {
        recommendations: [
          {
            productName: "テスト商品",
            reason: "テスト理由です。",
            score: 0.8,
            features: ["特徴1"],
          },
        ],
      };

      expect(service.validateResponse(validResponse)).toBe(true);
    });

    it("無効なレスポンスでfalseを返す", () => {
      const invalidResponse = {
        recommendations: [
          {
            productName: "", // 空の商品名
            reason: "テスト理由です。",
            score: 0.8,
            features: ["特徴1"],
          },
        ],
      };

      expect(service.validateResponse(invalidResponse)).toBe(false);
    });

    it("nullレスポンスでfalseを返す", () => {
      expect(service.validateResponse(null)).toBe(false);
    });
  });

  describe("リトライ機能", () => {
    it("一時的なエラーでリトライを実行する", async () => {
      // Create a service with faster retry for testing
      const fastRetryService = createMastraAIService({
        maxAttempts: 3,
        baseDelay: 10, // Very short delay for testing
        maxDelay: 50,
        backoffMultiplier: 1,
      });

      // 最初の2回は失敗、3回目は成功
      mockFetch
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              recommendations: [
                {
                  productName: "リトライ成功商品",
                  reason: "リトライ後に取得できた商品です。",
                  score: 0.8,
                  features: ["リトライ機能"],
                },
              ],
            }),
        });

      const { aiResponseAnalyzer } = await import("../ai-response-analyzer");
      (aiResponseAnalyzer.analyzeResponse as Mock).mockResolvedValueOnce({
        isValid: true,
        normalizedResponse: {
          recommendations: [
            {
              productName: "リトライ成功商品",
              reason: "リトライ後に取得できた商品です。",
              score: 0.8,
              features: ["リトライ機能"],
            },
          ],
        },
        qualityScore: 0.8,
        issues: [],
        metadata: {
          totalRecommendations: 1,
          averageScore: 0.8,
          scoreDistribution: { high: 0, medium: 1, low: 0 },
          hasIncompleteData: false,
          processingTime: 100,
        },
      });

      const retryRequest: AIRecommendationRequest = {
        prompt: "リトライテスト用のプロンプト",
        maxRecommendations: 3,
        temperature: 0.3,
      };

      const result = await fastRetryService.generateRecommendations(
        retryRequest
      );

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].productName).toBe("リトライ成功商品");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("最大リトライ回数に達したらエラーを投げる", async () => {
      // Create a service with faster retry for testing
      const fastRetryService = createMastraAIService({
        maxAttempts: 3,
        baseDelay: 10, // Very short delay for testing
        maxDelay: 50,
        backoffMultiplier: 1,
      });

      // すべてのリトライが失敗
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      const retryRequest: AIRecommendationRequest = {
        prompt: "リトライテスト用のプロンプト",
        maxRecommendations: 3,
        temperature: 0.3,
      };

      await expect(
        fastRetryService.generateRecommendations(retryRequest)
      ).rejects.toThrow("ネットワークエラーが発生しました");

      expect(mockFetch).toHaveBeenCalledTimes(3); // デフォルトの最大リトライ回数
    });
  });

  describe("createMastraAIService", () => {
    it("カスタムリトライ設定でサービスを作成する", () => {
      const customService = createMastraAIService({
        maxAttempts: 5,
        baseDelay: 2000,
      });

      expect(customService).toBeInstanceOf(MastraAIServiceImpl);
    });
  });
});
