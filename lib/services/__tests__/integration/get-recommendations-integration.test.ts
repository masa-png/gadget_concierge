/**
 * GET /api/recommendations/[sessionId] との連携確認テスト
 *
 * 生成されたレコメンドが既存 API で正しく取得できることを確認し、
 * レスポンス形式の互換性をテストします。
 *
 * 要件 4.2, 7.1, 7.2 の統合テスト
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/recommendations/generate/route";
import { GET } from "@/app/api/recommendations/[sessionId]/route";
import type { AIRecommendationResponse } from "@/lib/types/ai-recommendations";

// テスト用のモック設定
vi.mock("@/lib/prisma", () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
    },
    questionnaireSession: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    answer: {
      findMany: vi.fn(),
    },
    recommendation: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// 認証ミドルウェアのモック
vi.mock("@/lib/api/middleware", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    requireAuth: vi.fn().mockResolvedValue({
      success: true,
      user: { id: "test-user-123", email: "test@example.com" },
    }),
    rateLimit: vi.fn().mockReturnValue(true),
    createErrorResponse: vi.fn(
      (message, status, code) =>
        new Response(
          JSON.stringify({ success: false, error: { message, code } }),
          {
            status,
          }
        )
    ),
    createSuccessResponse: vi.fn(
      (data, message, status = 200) =>
        new Response(JSON.stringify({ success: true, data, message }), {
          status,
        })
    ),
    setSecurityHeaders: vi.fn((response) => response),
  };
});

// Mastra AI サービスのモック
vi.mock("@/lib/services/mastra-ai-service", () => ({
  mastraAIService: {
    generateRecommendations: vi.fn(),
    validateResponse: vi.fn(),
  },
}));

// Answer Processor のモック
vi.mock("@/lib/services/answer-processor", () => ({
  createAnswerProcessor: vi.fn(() => ({
    processSessionAnswers: vi.fn(),
    structureForAI: vi.fn(),
  })),
}));

// Prompt Generator のモック
vi.mock("@/lib/services/prompt-generator", () => ({
  createPromptGenerator: vi.fn(() => ({
    generatePrompt: vi.fn(),
  })),
}));

// Product Mapper のモック
vi.mock("@/lib/services/product-mapper", () => ({
  productMapperService: {
    mapWithConfidenceEvaluation: vi.fn(),
    getMatchingStatistics: vi.fn(),
  },
}));

// Recommendation Saver のモック
vi.mock("@/lib/services/recommendation-saver", () => ({
  recommendationSaverService: {
    saveRecommendations: vi.fn(),
  },
}));

// セキュリティユーティリティのモック
vi.mock("@/lib/utils/security", () => ({
  sanitizeInput: vi.fn((input) => input),
  validateApiKey: vi.fn(),
  withTimeout: vi.fn((promise) => promise),
  checkRateLimit: vi.fn(),
  maskSensitiveData: vi.fn((data) => "***masked***"),
}));

// 設定のモック
vi.mock("@/lib/config/ai-recommendations", () => ({
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
      apiUrl: "https://test-api.example.com",
    },
  },
  initializeAIConfig: vi.fn(),
}));

describe("GET /api/recommendations/[sessionId] 連携テスト", () => {
  let mockPrisma: any;
  let mockMastraAI: any;
  let mockAnswerProcessor: any;
  let mockPromptGenerator: any;
  let mockProductMapper: any;
  let mockRecommendationSaver: any;

  const testSessionId = "integration-test-session-123";
  const testUserId = "test-user-123";
  const testUserProfileId = "test-user-profile-123";
  const testCategoryId = "smartphone-category";

  beforeEach(async () => {
    vi.clearAllMocks();

    // Prisma モックの取得
    const { prisma } = await import("@/lib/prisma");
    mockPrisma = prisma;

    // Mastra AI モックの取得
    const { mastraAIService } = await import(
      "@/lib/services/mastra-ai-service"
    );
    mockMastraAI = mastraAIService;

    // Answer Processor モックの取得
    const { createAnswerProcessor } = await import(
      "@/lib/services/answer-processor"
    );
    mockAnswerProcessor = {
      processSessionAnswers: vi.fn(),
      structureForAI: vi.fn(),
    };
    (createAnswerProcessor as any).mockReturnValue(mockAnswerProcessor);

    // Prompt Generator モックの取得
    const { createPromptGenerator } = await import(
      "@/lib/services/prompt-generator"
    );
    mockPromptGenerator = {
      generatePrompt: vi.fn(),
    };
    (createPromptGenerator as any).mockReturnValue(mockPromptGenerator);

    // Product Mapper モックの取得
    const { productMapperService } = await import(
      "@/lib/services/product-mapper"
    );
    mockProductMapper = productMapperService;

    // Recommendation Saver モックの取得
    const { recommendationSaverService } = await import(
      "@/lib/services/recommendation-saver"
    );
    mockRecommendationSaver = recommendationSaverService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("レコメンド生成から取得までの完全フロー", () => {
    it("生成されたレコメンドが GET API で正しく取得できる", async () => {
      // テストデータの準備
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "テストユーザー",
        age: 30,
        gender: "MALE",
        occupation: "エンジニア",
      };

      const mockSession = {
        id: testSessionId,
        status: "COMPLETED",
        categoryId: testCategoryId,
        userProfileId: testUserProfileId,
        completed_at: new Date("2024-01-15T10:00:00Z"),
        category: {
          id: testCategoryId,
          name: "スマートフォン",
          description: "スマートフォンカテゴリ",
        },
      };

      const mockCategory = {
        id: testCategoryId,
        name: "スマートフォン",
      };

      const mockAnswers = [
        {
          id: "answer1",
          questionnaireSessionId: testSessionId,
          questionId: "question1",
          questionOptionId: "option1",
          range_value: null,
          text_value: null,
          question: {
            id: "question1",
            text: "予算はどのくらいですか？",
            type: "SINGLE_CHOICE",
            categoryId: testCategoryId,
          },
          option: {
            id: "option1",
            label: "10万円以下",
            value: "100000",
          },
        },
        {
          id: "answer2",
          questionnaireSessionId: testSessionId,
          questionId: "question2",
          questionOptionId: null,
          range_value: 85,
          text_value: null,
          question: {
            id: "question2",
            text: "カメラ性能の重要度（1-100）",
            type: "RANGE",
            categoryId: testCategoryId,
          },
          option: null,
        },
      ];

      const mockAIResponse: AIRecommendationResponse = {
        recommendations: [
          {
            productName: "iPhone 15 Pro",
            reason:
              "予算内で最高のカメラ性能を提供するプレミアムスマートフォンです。",
            score: 92,
            features: ["ProRAWカメラ", "チタニウムボディ", "A17 Proチップ"],
            priceRange: { min: 90000, max: 110000 },
          },
          {
            productName: "Google Pixel 8 Pro",
            reason:
              "AI機能とカメラ性能に優れたAndroidフラッグシップモデルです。",
            score: 88,
            features: ["AI写真編集", "望遠レンズ", "純正Android"],
            priceRange: { min: 80000, max: 95000 },
          },
        ],
      };

      const mockProducts = [
        {
          id: "product1",
          name: "iPhone 15 Pro 128GB",
          description: "Apple製プレミアムスマートフォン",
          features: "ProRAWカメラ、チタニウムボディ、A17 Proチップ、防水機能",
          price: 105000,
          rating: 4.8,
          review_count: 250,
          rakuten_url: "https://item.rakuten.co.jp/test/iphone15pro/",
          image_url: "https://example.com/images/iphone15pro.jpg",
        },
        {
          id: "product2",
          name: "Google Pixel 8 Pro 256GB",
          description: "Google製AIスマートフォン",
          features: "AI写真編集、望遠レンズ、純正Android、高速充電",
          price: 89000,
          rating: 4.6,
          review_count: 180,
          rakuten_url: "https://item.rakuten.co.jp/test/pixel8pro/",
          image_url: "https://example.com/images/pixel8pro.jpg",
        },
      ];

      // ステップ 1: レコメンド生成のモック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.answer.findMany.mockResolvedValue(mockAnswers);
      mockPrisma.recommendation.findMany.mockResolvedValueOnce([]); // 初回は空（重複チェック）
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.recommendation.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.$transaction.mockImplementation((callback: any) =>
        callback(mockPrisma)
      );

      mockMastraAI.generateRecommendations.mockResolvedValue(mockAIResponse);
      mockMastraAI.validateResponse.mockReturnValue(true);

      // ステップ 2: レコメンド生成リクエストの実行
      const generateRequest = new NextRequest(
        "http://localhost:3000/api/recommendations/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId: testSessionId }),
        }
      );

      const generateResponse = await POST(generateRequest);
      const generateData = await generateResponse.json();

      // 生成レスポンスの検証
      expect(generateResponse.status).toBe(200);
      expect(generateData.success).toBe(true);
      expect(generateData.data.sessionId).toBe(testSessionId);
      expect(generateData.data.recommendationsCount).toBe(2);

      // ステップ 3: 生成されたレコメンドデータの準備（GET API用）
      const generatedRecommendations = [
        {
          id: "rec1",
          questionnaireSessionId: testSessionId,
          productId: "product1",
          rank: 1,
          score: 92,
          reason:
            "予算内で最高のカメラ性能を提供するプレミアムスマートフォンです。",
          product: mockProducts[0],
        },
        {
          id: "rec2",
          questionnaireSessionId: testSessionId,
          productId: "product2",
          rank: 2,
          score: 88,
          reason: "AI機能とカメラ性能に優れたAndroidフラッグシップモデルです。",
          product: mockProducts[1],
        },
      ];

      // ステップ 4: GET API のモック設定
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.recommendation.findMany.mockResolvedValue(
        generatedRecommendations
      );

      // ステップ 5: GET API リクエストの実行
      const getRequest = new NextRequest(
        `http://localhost:3000/api/recommendations/${testSessionId}`,
        {
          method: "GET",
        }
      );

      const getResponse = await GET(getRequest, {
        params: { sessionId: testSessionId },
      });
      const getData = await getResponse.json();

      // ステップ 6: GET API レスポンスの検証
      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data).toBeDefined();

      // セッション情報の検証
      expect(getData.data.session).toEqual({
        id: testSessionId,
        categoryId: testCategoryId,
        categoryName: "スマートフォン",
        status: "COMPLETED",
        completed_at: mockSession.completed_at,
      });

      // レコメンド情報の検証
      expect(getData.data.recommendations).toHaveLength(2);
      expect(getData.data.total).toBe(2);

      // 第1位レコメンドの詳細検証
      const firstRecommendation = getData.data.recommendations[0];
      expect(firstRecommendation).toEqual({
        id: "rec1",
        rank: 1,
        score: 92,
        reason:
          "予算内で最高のカメラ性能を提供するプレミアムスマートフォンです。",
        product: {
          id: "product1",
          name: "iPhone 15 Pro 128GB",
          description: "Apple製プレミアムスマートフォン",
          price: 105000,
          rating: 4.8,
          features: "ProRAWカメラ、チタニウムボディ、A17 Proチップ、防水機能",
          rakuten_url: "https://item.rakuten.co.jp/test/iphone15pro/",
          image_url: "https://example.com/images/iphone15pro.jpg",
        },
      });

      // 第2位レコメンドの詳細検証
      const secondRecommendation = getData.data.recommendations[1];
      expect(secondRecommendation).toEqual({
        id: "rec2",
        rank: 2,
        score: 88,
        reason: "AI機能とカメラ性能に優れたAndroidフラッグシップモデルです。",
        product: {
          id: "product2",
          name: "Google Pixel 8 Pro 256GB",
          description: "Google製AIスマートフォン",
          price: 89000,
          rating: 4.6,
          features: "AI写真編集、望遠レンズ、純正Android、高速充電",
          rakuten_url: "https://item.rakuten.co.jp/test/pixel8pro/",
          image_url: "https://example.com/images/pixel8pro.jpg",
        },
      });

      // データベース呼び出しの検証
      expect(mockPrisma.recommendation.findMany).toHaveBeenCalledWith({
        where: { questionnaireSessionId: testSessionId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              rating: true,
              features: true,
              rakuten_url: true,
              image_url: true,
            },
          },
        },
        orderBy: { rank: "asc" },
      });
    });

    it("レコメンドが存在しない場合は空の配列を返す", async () => {
      // テストデータの準備
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "テストユーザー",
      };

      const mockSession = {
        id: testSessionId,
        status: "COMPLETED",
        categoryId: testCategoryId,
        userProfileId: testUserProfileId,
        completed_at: new Date("2024-01-15T10:00:00Z"),
      };

      const mockCategory = {
        id: testCategoryId,
        name: "スマートフォン",
      };

      // モック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.recommendation.findMany.mockResolvedValue([]); // 空の配列

      // GET API リクエストの実行
      const getRequest = new NextRequest(
        `http://localhost:3000/api/recommendations/${testSessionId}`,
        {
          method: "GET",
        }
      );

      const getResponse = await GET(getRequest, {
        params: { sessionId: testSessionId },
      });
      const getData = await getResponse.json();

      // レスポンスの検証
      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data.recommendations).toEqual([]);
      expect(getData.data.total).toBe(0);
      expect(getData.data.session).toEqual({
        id: testSessionId,
        categoryId: testCategoryId,
        categoryName: "スマートフォン",
        status: "COMPLETED",
        completed_at: mockSession.completed_at,
      });
    });
  });

  describe("レスポンス形式の互換性テスト", () => {
    it("GET API のレスポンス形式が期待される構造と一致する", async () => {
      // テストデータの準備
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "テストユーザー",
      };

      const mockSession = {
        id: testSessionId,
        status: "COMPLETED",
        categoryId: testCategoryId,
        userProfileId: testUserProfileId,
        completed_at: new Date("2024-01-15T10:00:00Z"),
      };

      const mockCategory = {
        id: testCategoryId,
        name: "スマートフォン",
      };

      const mockRecommendations = [
        {
          id: "rec1",
          questionnaireSessionId: testSessionId,
          productId: "product1",
          rank: 1,
          score: 90,
          reason: "テスト理由",
          product: {
            id: "product1",
            name: "テスト商品",
            description: "テスト説明",
            price: 50000,
            rating: 4.5,
            features: "テスト機能",
            rakuten_url: "https://test.rakuten.co.jp/item",
            image_url: "https://test.example.com/image.jpg",
          },
        },
      ];

      // モック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.recommendation.findMany.mockResolvedValue(mockRecommendations);

      // GET API リクエストの実行
      const getRequest = new NextRequest(
        `http://localhost:3000/api/recommendations/${testSessionId}`,
        {
          method: "GET",
        }
      );

      const getResponse = await GET(getRequest, {
        params: { sessionId: testSessionId },
      });
      const getData = await getResponse.json();

      // レスポンス構造の検証
      expect(getData).toHaveProperty("success", true);
      expect(getData).toHaveProperty("data");
      expect(getData.data).toHaveProperty("session");
      expect(getData.data).toHaveProperty("recommendations");
      expect(getData.data).toHaveProperty("total");

      // セッション構造の検証
      expect(getData.data.session).toHaveProperty("id");
      expect(getData.data.session).toHaveProperty("categoryId");
      expect(getData.data.session).toHaveProperty("categoryName");
      expect(getData.data.session).toHaveProperty("status");
      expect(getData.data.session).toHaveProperty("completed_at");

      // レコメンド構造の検証
      const recommendation = getData.data.recommendations[0];
      expect(recommendation).toHaveProperty("id");
      expect(recommendation).toHaveProperty("rank");
      expect(recommendation).toHaveProperty("score");
      expect(recommendation).toHaveProperty("reason");
      expect(recommendation).toHaveProperty("product");

      // 商品構造の検証
      expect(recommendation.product).toHaveProperty("id");
      expect(recommendation.product).toHaveProperty("name");
      expect(recommendation.product).toHaveProperty("description");
      expect(recommendation.product).toHaveProperty("price");
      expect(recommendation.product).toHaveProperty("rating");
      expect(recommendation.product).toHaveProperty("features");
      expect(recommendation.product).toHaveProperty("rakuten_url");
      expect(recommendation.product).toHaveProperty("image_url");
    });

    it("データ型が正しく設定されている", async () => {
      // テストデータの準備（前のテストと同様）
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "テストユーザー",
      };

      const mockSession = {
        id: testSessionId,
        status: "COMPLETED",
        categoryId: testCategoryId,
        userProfileId: testUserProfileId,
        completed_at: new Date("2024-01-15T10:00:00Z"),
      };

      const mockCategory = {
        id: testCategoryId,
        name: "スマートフォン",
      };

      const mockRecommendations = [
        {
          id: "rec1",
          questionnaireSessionId: testSessionId,
          productId: "product1",
          rank: 1,
          score: 90.5,
          reason: "テスト理由",
          product: {
            id: "product1",
            name: "テスト商品",
            description: "テスト説明",
            price: 50000,
            rating: 4.5,
            features: "テスト機能",
            rakuten_url: "https://test.rakuten.co.jp/item",
            image_url: "https://test.example.com/image.jpg",
          },
        },
      ];

      // モック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.recommendation.findMany.mockResolvedValue(mockRecommendations);

      // GET API リクエストの実行
      const getRequest = new NextRequest(
        `http://localhost:3000/api/recommendations/${testSessionId}`,
        {
          method: "GET",
        }
      );

      const getResponse = await GET(getRequest, {
        params: { sessionId: testSessionId },
      });
      const getData = await getResponse.json();

      // データ型の検証
      expect(typeof getData.success).toBe("boolean");
      expect(typeof getData.data.session.id).toBe("string");
      expect(typeof getData.data.session.categoryId).toBe("string");
      expect(typeof getData.data.session.categoryName).toBe("string");
      expect(typeof getData.data.session.status).toBe("string");
      expect(typeof getData.data.total).toBe("number");
      expect(Array.isArray(getData.data.recommendations)).toBe(true);

      const recommendation = getData.data.recommendations[0];
      expect(typeof recommendation.id).toBe("string");
      expect(typeof recommendation.rank).toBe("number");
      expect(typeof recommendation.score).toBe("number");
      expect(typeof recommendation.reason).toBe("string");
      expect(typeof recommendation.product).toBe("object");

      expect(typeof recommendation.product.id).toBe("string");
      expect(typeof recommendation.product.name).toBe("string");
      expect(typeof recommendation.product.description).toBe("string");
      expect(typeof recommendation.product.price).toBe("number");
      expect(typeof recommendation.product.rating).toBe("number");
      expect(typeof recommendation.product.features).toBe("string");
      expect(typeof recommendation.product.rakuten_url).toBe("string");
      expect(typeof recommendation.product.image_url).toBe("string");
    });
  });

  describe("エラーケースの互換性", () => {
    it("存在しないセッションで404エラーを返す", async () => {
      const nonExistentSessionId = "non-existent-session";

      // モック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue({
        id: testUserProfileId,
        userId: testUserId,
        full_name: "テストユーザー",
      });
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(null);

      // GET API リクエストの実行
      const getRequest = new NextRequest(
        `http://localhost:3000/api/recommendations/${nonExistentSessionId}`,
        {
          method: "GET",
        }
      );

      const getResponse = await GET(getRequest, {
        params: { sessionId: nonExistentSessionId },
      });
      const getData = await getResponse.json();

      // エラーレスポンスの検証
      expect(getResponse.status).toBe(404);
      expect(getData.success).toBe(false);
      expect(getData.error).toBeDefined();
      expect(getData.error.message).toContain("セッションが見つかりません");
    });

    it("ユーザープロフィールが存在しない場合は404エラーを返す", async () => {
      // モック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      // GET API リクエストの実行
      const getRequest = new NextRequest(
        `http://localhost:3000/api/recommendations/${testSessionId}`,
        {
          method: "GET",
        }
      );

      const getResponse = await GET(getRequest, {
        params: { sessionId: testSessionId },
      });
      const getData = await getResponse.json();

      // エラーレスポンスの検証
      expect(getResponse.status).toBe(404);
      expect(getData.success).toBe(false);
      expect(getData.error).toBeDefined();
      expect(getData.error.message).toContain(
        "ユーザープロフィールが見つかりません"
      );
    });
  });
});
