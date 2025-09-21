/**
 * セキュリティユーティリティのテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  removePII,
  removeHtmlAndScripts,
  sanitizeInput,
  validateApiKey,
  withTimeout,
  checkRateLimit,
  generateSecureRandomString,
  maskSensitiveData,
} from "../security";

describe("セキュリティユーティリティ", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("removePII", () => {
    it("電話番号を除去する", () => {
      const text = "私の電話番号は090-1234-5678です";
      const result = removePII(text);
      expect(result).toBe("私の電話番号は[REDACTED]です");
    });

    it("メールアドレスを除去する", () => {
      const text = "連絡先: test@example.com";
      const result = removePII(text);
      expect(result).toBe("連絡先: [REDACTED]");
    });

    it("郵便番号を除去する", () => {
      const text = "住所: 123-4567 東京都";
      const result = removePII(text);
      expect(result).toBe("住所: [REDACTED] 東京都");
    });

    it("カスタム置換文字列を使用する", () => {
      const text = "電話: 090-1234-5678";
      const result = removePII(text, "[MASKED]");
      expect(result).toBe("電話: [MASKED]");
    });
  });

  describe("removeHtmlAndScripts", () => {
    it("HTMLタグを除去する", () => {
      const text = "<p>テスト<strong>文字列</strong></p>";
      const result = removeHtmlAndScripts(text);
      expect(result).toBe("テスト文字列");
    });

    it("スクリプトタグを除去する", () => {
      const text = "安全な文字列<script>alert('危険')</script>続き";
      const result = removeHtmlAndScripts(text);
      expect(result).toBe("安全な文字列続き");
    });

    it("HTMLエンティティをデコードする", () => {
      const text = "&lt;div&gt;&amp;test&quot;";
      const result = removeHtmlAndScripts(text);
      expect(result).toBe('<div>&test"');
    });
  });

  describe("sanitizeInput", () => {
    it("基本的なサニタイゼーションを実行する", () => {
      const input = "<script>alert('test')</script>安全な文字列";
      const result = sanitizeInput(input);
      expect(result).toBe("安全な文字列");
    });

    it("最大文字数制限をチェックする", () => {
      const input = "a".repeat(101);
      expect(() => sanitizeInput(input, { maxLength: 100 })).toThrow(
        "入力が最大文字数（100）を超えています"
      );
    });

    it("許可文字セットをチェックする", () => {
      const input = "abc123";
      const result = sanitizeInput(input, { allowedChars: "a-z0-9" });
      expect(result).toBe("abc123");

      expect(() =>
        sanitizeInput("abc@123", { allowedChars: "a-z0-9" })
      ).toThrow("許可されていない文字が含まれています");
    });

    it("PII除去を無効にできる", () => {
      const input = "電話: 090-1234-5678";
      const result = sanitizeInput(input, { removePII: false });
      expect(result).toBe("電話: 090-1234-5678");
    });
  });

  describe("validateApiKey", () => {
    it("有効なAPIキーを検証する", () => {
      const apiKey = "valid-api-key-12345";
      const result = validateApiKey(apiKey);
      expect(result).toBe(apiKey);
    });

    it("空のAPIキーを拒否する", () => {
      expect(() => validateApiKey("")).toThrow("API keyが設定されていません");
      expect(() => validateApiKey(null)).toThrow("API keyが設定されていません");
      expect(() => validateApiKey(undefined)).toThrow(
        "API keyが設定されていません"
      );
    });

    it("短すぎるAPIキーを拒否する", () => {
      expect(() => validateApiKey("short")).toThrow(
        "API keyが短すぎます（最低10文字必要）"
      );
    });

    it("危険な文字を含むAPIキーを拒否する", () => {
      expect(() => validateApiKey("api<script>alert()</script>")).toThrow(
        "API keyに無効な文字が含まれています"
      );
      expect(() => validateApiKey("javascript:alert()")).toThrow(
        "API keyに無効な文字が含まれています"
      );
    });

    it("カスタムキー名でエラーメッセージを表示する", () => {
      expect(() => validateApiKey("", "Mastra API Key")).toThrow(
        "Mastra API Keyが設定されていません"
      );
    });
  });

  describe("withTimeout", () => {
    it("正常なPromiseを実行する", async () => {
      const promise = Promise.resolve("成功");
      const result = await withTimeout(promise, 1000);
      expect(result).toBe("成功");
    });

    it("タイムアウトでエラーを投げる", async () => {
      vi.useFakeTimers();

      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve("遅い結果"), 2000);
      });

      const timeoutPromise = withTimeout(
        slowPromise,
        1000,
        "カスタムタイムアウト"
      );

      vi.advanceTimersByTime(1000);

      await expect(timeoutPromise).rejects.toThrow(
        "カスタムタイムアウト（1000ms）"
      );

      vi.useRealTimers();
    });

    it("無効なタイムアウト値を拒否する", async () => {
      const promise = Promise.resolve("test");

      await expect(withTimeout(promise, 0)).rejects.toThrow(
        "タイムアウト値は1ms〜300000ms（5分）の範囲で設定してください"
      );

      await expect(withTimeout(promise, 400000)).rejects.toThrow(
        "タイムアウト値は1ms〜300000ms（5分）の範囲で設定してください"
      );
    });
  });

  describe("checkRateLimit", () => {
    it("制限内のリクエストを許可する", () => {
      const result = checkRateLimit("test-key", 5, 60000);
      expect(result).toBe(true);
    });

    it("制限を超えたリクエストを拒否する", () => {
      const key = "rate-limit-test";

      // 制限まで実行
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, 3, 60000);
      }

      // 制限超過
      expect(() => checkRateLimit(key, 3, 60000)).toThrow(
        /レート制限に達しました/
      );
    });
  });

  describe("generateSecureRandomString", () => {
    it("指定された長さの文字列を生成する", () => {
      const result = generateSecureRandomString(16);
      expect(result).toHaveLength(16);
    });

    it("カスタム文字セットを使用する", () => {
      const result = generateSecureRandomString(10, "ABC123");
      expect(result).toMatch(/^[ABC123]+$/);
      expect(result).toHaveLength(10);
    });

    it("無効な長さを拒否する", () => {
      expect(() => generateSecureRandomString(0)).toThrow(
        "文字列長は1〜1000の範囲で指定してください"
      );
      expect(() => generateSecureRandomString(1001)).toThrow(
        "文字列長は1〜1000の範囲で指定してください"
      );
    });
  });

  describe("maskSensitiveData", () => {
    it("機密データをマスクする", () => {
      const result = maskSensitiveData("1234567890abcdef", 4);
      expect(result).toBe("1234********cdef");
    });

    it("短い値を完全にマスクする", () => {
      const result = maskSensitiveData("short", 4);
      expect(result).toBe("********");
    });

    it("カスタムマスク文字を使用する", () => {
      const result = maskSensitiveData("1234567890", 2, "X");
      expect(result).toBe("12XXXXXX90");
    });
  });
});
