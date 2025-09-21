/**
 * AI推奨システム用バリデーションスキーマのテスト
 */

import { describe, it, expect } from "vitest";
import {
  sessionIdSchema,
  generateRecommendationRequestSchema,
  aiRecommendationItemSchema,
  aiRecommendationResponseSchema,
  processedAnswerSchema,
  successResponseSchema,
  errorResponseSchema,
  validateSessionId,
  validateAIRecommendationResponse,
  validateProcessedAnswers,
} from "../ai-recommendations";

describe("AI推奨システムバリデーション", () => {
  describe("sessionIdSchema", () => {
    it("有効なセッションIDを受け入れる", () => {
      const validIds = [
        "clh1234567890abcdef",
        "session-123",
        "test_session_id",
        "ABC123def456",
      ];

      validIds.forEach((id) => {
        expect(() => sessionIdSchema.parse(id)).not.toThrow();
      });
    });

    it("無効なセッションIDを拒否する", () => {
      const invalidIds = [
        "", // 空文字
        "a".repeat(51), // 長すぎる
        "session@id", // 無効文字
        "session id", // スペース
        "session#id", // 特殊文字
      ];

      invalidIds.forEach((id) => {
        expect(() => sessionIdSchema.parse(id)).toThrow();
      });
    });
  });

  describe("generateRecommendationRequestSchema", () => {
    it("有効なリクエストを受け入れる", () => {
      const validRequest = {
        sessionId: "clh1234567890abcdef",
      };

      expect(() =>
        generateRecommendationRequestSchema.parse(validRequest)
      ).not.toThrow();
    });

    it("無効なリクエストを拒否する", () => {
      const invalidRequests = [
        {}, // sessionId なし
        { sessionId: "" }, // 空のsessionId
        { sessionId: "invalid@id" }, // 無効文字
      ];

      invalidRequests.forEach((request) => {
        expect(() =>
          generateRecommendationRequestSchema.parse(request)
        ).toThrow();
      });
    });
  });

  describe("aiRecommendationItemSchema", () => {
    it("有効なAI推奨アイテムを受け入れる", () => {
      const validItem = {
        productName: "テスト商品",
        reason: "この商品はあなたの好みに合います",
        score: 0.85,
        features: ["高品質", "コストパフォーマンス"],
        priceRange: {
          min: 1000,
          max: 5000,
        },
      };

      expect(() => aiRecommendationItemSchema.parse(validItem)).not.toThrow();
    });

    it("priceRangeなしでも受け入れる", () => {
      const validItem = {
        productName: "テスト商品",
        reason: "推奨理由",
        score: 0.5,
        features: ["特徴1"],
      };

      expect(() => aiRecommendationItemSchema.parse(validItem)).not.toThrow();
    });

    it("無効なAI推奨アイテムを拒否する", () => {
      const invalidItems = [
        {
          // productName なし
          reason: "理由",
          score: 0.5,
          features: [],
        },
        {
          productName: "商品",
          reason: "理由",
          score: 1.5, // スコア範囲外
          features: [],
        },
        {
          productName: "商品",
          reason: "理由",
          score: 0.5,
          features: [],
          priceRange: {
            min: 5000,
            max: 1000, // min > max
          },
        },
      ];

      invalidItems.forEach((item) => {
        expect(() => aiRecommendationItemSchema.parse(item)).toThrow();
      });
    });
  });

  describe("aiRecommendationResponseSchema", () => {
    it("有効なAI推奨レスポンスを受け入れる", () => {
      const validResponse = {
        recommendations: [
          {
            productName: "商品1",
            reason: "理由1",
            score: 0.9,
            features: ["特徴1"],
          },
          {
            productName: "商品2",
            reason: "理由2",
            score: 0.8,
            features: ["特徴2", "特徴3"],
          },
        ],
      };

      expect(() =>
        aiRecommendationResponseSchema.parse(validResponse)
      ).not.toThrow();
    });

    it("空の推奨配列を拒否する", () => {
      const invalidResponse = {
        recommendations: [],
      };

      expect(() =>
        aiRecommendationResponseSchema.parse(invalidResponse)
      ).toThrow();
    });
  });

  describe("processedAnswerSchema", () => {
    it("SINGLE_CHOICE回答を受け入れる", () => {
      const validAnswer = {
        questionId: "q1",
        questionText: "質問文",
        questionType: "SINGLE_CHOICE" as const,
        answer: {
          optionLabel: "選択肢A",
          optionValue: "a",
        },
      };

      expect(() => processedAnswerSchema.parse(validAnswer)).not.toThrow();
    });

    it("RANGE回答を受け入れる", () => {
      const validAnswer = {
        questionId: "q2",
        questionText: "範囲質問",
        questionType: "RANGE" as const,
        answer: {
          rangeValue: 75,
        },
      };

      expect(() => processedAnswerSchema.parse(validAnswer)).not.toThrow();
    });

    it("TEXT回答を受け入れる", () => {
      const validAnswer = {
        questionId: "q3",
        questionText: "テキスト質問",
        questionType: "TEXT" as const,
        answer: {
          textValue: "自由回答テキスト",
        },
      };

      expect(() => processedAnswerSchema.parse(validAnswer)).not.toThrow();
    });

    it("無効な質問タイプを拒否する", () => {
      const invalidAnswer = {
        questionId: "q1",
        questionText: "質問文",
        questionType: "INVALID_TYPE",
        answer: {},
      };

      expect(() => processedAnswerSchema.parse(invalidAnswer)).toThrow();
    });
  });

  describe("バリデーションヘルパー関数", () => {
    describe("validateSessionId", () => {
      it("有効なセッションIDを返す", () => {
        const sessionId = "clh1234567890abcdef";
        const result = validateSessionId(sessionId);
        expect(result).toBe(sessionId);
      });

      it("無効なセッションIDでエラーを投げる", () => {
        expect(() => validateSessionId("invalid@id")).toThrow();
      });
    });

    describe("validateAIRecommendationResponse", () => {
      it("有効なレスポンスを返す", () => {
        const response = {
          recommendations: [
            {
              productName: "商品",
              reason: "理由",
              score: 0.8,
              features: ["特徴"],
            },
          ],
        };

        const result = validateAIRecommendationResponse(response);
        expect(result).toEqual(response);
      });

      it("無効なレスポンスでエラーを投げる", () => {
        const invalidResponse = {
          recommendations: [],
        };

        expect(() =>
          validateAIRecommendationResponse(invalidResponse)
        ).toThrow();
      });
    });

    describe("validateProcessedAnswers", () => {
      it("有効な回答配列を返す", () => {
        const answers = [
          {
            questionId: "q1",
            questionText: "質問1",
            questionType: "SINGLE_CHOICE" as const,
            answer: {
              optionLabel: "選択肢A",
              optionValue: "a",
            },
          },
        ];

        const result = validateProcessedAnswers(answers);
        expect(result).toEqual(answers);
      });

      it("無効な回答配列でエラーを投げる", () => {
        const invalidAnswers = [
          {
            questionId: "q1",
            // questionText なし
            questionType: "SINGLE_CHOICE",
            answer: {},
          },
        ];

        expect(() => validateProcessedAnswers(invalidAnswers)).toThrow();
      });
    });
  });

  describe("successResponseSchema", () => {
    it("有効な成功レスポンスを受け入れる", () => {
      const validResponse = {
        success: true as const,
        data: {
          sessionId: "clh1234567890abcdef",
          recommendationCount: 5,
          message: "成功メッセージ",
        },
      };

      expect(() => successResponseSchema.parse(validResponse)).not.toThrow();
    });
  });

  describe("errorResponseSchema", () => {
    it("有効なエラーレスポンスを受け入れる", () => {
      const validResponse = {
        success: false as const,
        error: {
          code: "VALIDATION_ERROR",
          message: "バリデーションエラーが発生しました",
          details: {
            field: "sessionId",
            value: "invalid",
          },
        },
      };

      expect(() => errorResponseSchema.parse(validResponse)).not.toThrow();
    });
  });
});
