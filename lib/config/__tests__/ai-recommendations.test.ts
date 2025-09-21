/**
 * AI推奨システム設定のテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  initializeAIConfig,
  validateAIConfig,
  debugAIConfig,
} from "../ai-recommendations";

describe("AI推奨システム設定", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("設定の初期化", () => {
    it("有効な環境変数で設定を初期化する", () => {
      process.env.MASTRA_API_KEY = "test-api-key-12345";
      process.env.MASTRA_API_URL = "https://api.test.com";
      process.env.MASTRA_TIMEOUT = "25000";
      process.env.MAX_RECOMMENDATIONS = "8";
      process.env.MAPPING_CONFIDENCE_THRESHOLD = "0.8";
      process.env.AI_TEMPERATURE = "0.5";

      const config = initializeAIConfig();

      expect(config.maxRecommendations).toBe(8);
      expect(config.mappingThreshold).toBe(0.8);
      expect(config.aiTemperature).toBe(0.5);
      expect(config.timeouts.aiRequest).toBe(25000);
      expect(config.mastra.apiKey).toBe("test-api-key-12345");
      expect(config.mastra.apiUrl).toBe("https://api.test.com");
    });

    it("デフォルト値を使用する", () => {
      process.env.MASTRA_API_KEY = "test-api-key-12345";
      // 他の環境変数は設定しない

      const config = initializeAIConfig();

      expect(config.maxRecommendations).toBe(10);
      expect(config.mappingThreshold).toBe(0.7);
      expect(config.aiTemperature).toBe(0.3);
      expect(config.timeouts.aiRequest).toBe(30000);
      expect(config.mastra.apiUrl).toBe("https://api.mastra.ai");
    });

    it("必須環境変数が不足している場合はエラーを投げる", () => {
      delete process.env.MASTRA_API_KEY;

      expect(() => initializeAIConfig()).toThrow(/Required/);
    });

    it("無効な数値範囲でエラーを投げる", () => {
      process.env.MASTRA_API_KEY = "test-api-key-12345";
      process.env.MAX_RECOMMENDATIONS = "100"; // 範囲外

      expect(() => initializeAIConfig()).toThrow();
    });

    it("無効なURL形式でエラーを投げる", () => {
      process.env.MASTRA_API_KEY = "test-api-key-12345";
      process.env.MASTRA_API_URL = "invalid-url";

      expect(() => initializeAIConfig()).toThrow();
    });

    it("無効な数値文字列でエラーを投げる", () => {
      process.env.MASTRA_API_KEY = "test-api-key-12345";
      process.env.MASTRA_TIMEOUT = "not-a-number";

      expect(() => initializeAIConfig()).toThrow();
    });
  });

  describe("設定値の範囲検証", () => {
    beforeEach(() => {
      process.env.MASTRA_API_KEY = "test-api-key-12345";
    });

    it("mappingThresholdの範囲を検証する", () => {
      process.env.MAPPING_CONFIDENCE_THRESHOLD = "1.5"; // 範囲外
      expect(() => initializeAIConfig()).toThrow();

      process.env.MAPPING_CONFIDENCE_THRESHOLD = "-0.1"; // 範囲外
      expect(() => initializeAIConfig()).toThrow();

      process.env.MAPPING_CONFIDENCE_THRESHOLD = "0.5"; // 有効
      expect(() => initializeAIConfig()).not.toThrow();
    });

    it("aiTemperatureの範囲を検証する", () => {
      process.env.AI_TEMPERATURE = "2.0"; // 範囲外
      expect(() => initializeAIConfig()).toThrow();

      process.env.AI_TEMPERATURE = "-0.1"; // 範囲外
      expect(() => initializeAIConfig()).toThrow();

      process.env.AI_TEMPERATURE = "0.7"; // 有効
      expect(() => initializeAIConfig()).not.toThrow();
    });

    it("maxRecommendationsの範囲を検証する", () => {
      process.env.MAX_RECOMMENDATIONS = "0"; // 範囲外
      expect(() => initializeAIConfig()).toThrow();

      process.env.MAX_RECOMMENDATIONS = "100"; // 範囲外
      expect(() => initializeAIConfig()).toThrow();

      process.env.MAX_RECOMMENDATIONS = "25"; // 有効
      expect(() => initializeAIConfig()).not.toThrow();
    });

    it("タイムアウト値の範囲を検証する", () => {
      process.env.MASTRA_TIMEOUT = "500"; // 範囲外（短すぎる）
      expect(() => initializeAIConfig()).toThrow();

      process.env.MASTRA_TIMEOUT = "200000"; // 範囲外（長すぎる）
      expect(() => initializeAIConfig()).toThrow();

      process.env.MASTRA_TIMEOUT = "15000"; // 有効
      expect(() => initializeAIConfig()).not.toThrow();
    });
  });

  describe("レガシー関数", () => {
    it("validateAIConfig は非推奨だが動作する", () => {
      process.env.MASTRA_API_KEY = "test-api-key-12345";

      expect(() => validateAIConfig()).not.toThrow();
    });

    it("validateAIConfig は設定エラーでエラーを投げる", () => {
      delete process.env.MASTRA_API_KEY;

      expect(() => validateAIConfig()).toThrow(/設定検証エラー/);
    });
  });

  describe("デバッグ機能", () => {
    it("開発環境でデバッグ情報を出力する", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
      });
      process.env.MASTRA_API_KEY = "test-api-key-12345";

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      debugAIConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("AI推奨システム設定情報")
      );

      consoleSpy.mockRestore();
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        writable: true,
      });
    });

    it("本番環境ではデバッグ情報を出力しない", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
      });
      process.env.MASTRA_API_KEY = "test-api-key-12345";

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      debugAIConfig();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalNodeEnv,
        writable: true,
      });
    });
  });

  describe("型安全性", () => {
    it("設定オブジェクトが正しい型を持つ", () => {
      process.env.MASTRA_API_KEY = "test-api-key-12345";

      const config = initializeAIConfig();

      expect(typeof config.maxRecommendations).toBe("number");
      expect(typeof config.mappingThreshold).toBe("number");
      expect(typeof config.aiTemperature).toBe("number");
      expect(typeof config.timeouts.aiRequest).toBe("number");
      expect(typeof config.timeouts.dbOperation).toBe("number");
      expect(typeof config.mastra.apiKey).toBe("string");
      expect(typeof config.mastra.apiUrl).toBe("string");
      expect(typeof config.mastra.timeout).toBe("number");
    });
  });
});
