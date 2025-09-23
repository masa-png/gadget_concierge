/**
 * エンドツーエンドレコメンドテスト
 *
 * フロントエンドからの完全なレコメンド生成フローをテストし、
 * エラーシナリオでの適切な処理確認を実装します。
 *
 * 要件: 全要件の統合テスト
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
    validateRequest: vi.fn(() => () => ({
      success: true,
      data: { sessionId: "test-session-123" },
    })),
  };
});

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

// Mastra AI サービスのモック
vi.mock("@/lib/services/mastra-ai-service", () => ({
  mastraAIService: {
    generateRecommendations: vi.fn(),
    validateResponse: vi.fn(),
  },
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

describe("エンドツーエンドレコメンドテスト", () => {
  let mockPrisma: any;
  let mockAnswerProcessor: any;
  let mockPromptGenerator: any;
  let mockMastraAI: any;
  let mockProductMapper: any;
  let mockRecommendationSaver: any;

  const testSessionId = "e2e-test-session-123";
  const testUserId = "test-user-123";
  const testUserProfileId = "test-user-profile-123";
  const testCategoryId = "smartphone-category";

  beforeEach(async () => {
    vi.clearAllMocks();

    // Prisma モックの取得
    const { prisma } = await import("@/lib/prisma");
    mockPrisma = prisma;

    // サービスモックの取得
    const { createAnswerProcessor } = await import(
      "@/lib/services/answer-processor"
    );
    mockAnswerProcessor = {
      processSessionAnswers: vi.fn(),
      structureForAI: vi.fn(),
    };
    (createAnswerProcessor as any).mockReturnValue(mockAnswerProcessor);

    const { createPromptGenerator } = await import(
      "@/lib/services/prompt-generator"
    );
    mockPromptGenerator = {
      generatePrompt: vi.fn(),
    };
    (createPromptGenerator as any).mockReturnValue(mockPromptGenerator);

    const { mastraAIService } = await import(
      "@/lib/services/mastra-ai-service"
    );
    mockMastraAI = mastraAIService;

    const { productMapperService } = await import(
      "@/lib/services/product-mapper"
    );
    mockProductMapper = productMapperService;

    const { recommendationSaverService } = await import(
      "@/lib/services/recommendation-saver"
    );
    mockRecommendationSaver = recommendationSaverService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("完全なレコメンド生成フロー", () => {
    it("フロントエンドからの完全なフローが正常に動作する", async () => {
      // ステップ 1: テストデータの準備
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "山田太郎",
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
          range_value: 90,
          text_value: null,
          question: {
            id: "question2",
            text: "カメラ性能の重要度（1-100）",
            type: "RANGE",
            categoryId: testCategoryId,
          },
          option: null,
        },
        {
          id: "answer3",
          questionnaireSessionId: testSessionId,
          questionId: "question3",
          questionOptionId: null,
          range_value: null,
          text_value: "ゲームをよくプレイします",
          question: {
            id: "question3",
            text: "主な用途を教えてください",
            type: "TEXT",
            categoryId: testCategoryId,
          },
          option: null,
        },
      ];

      const mockAIResponse: AIRecommendationResponse = {
        recommendations: [
          {
            productName: "iPhone 15 Pro Max",
            reason:
              "予算内で最高のカメラ性能とゲーム性能を提供するプレミアムスマートフォンです。",
            score: 95,
            features: ["ProRAWカメラ", "A17 Proチップ", "120Hz ProMotion"],
            priceRange: { min: 95000, max: 110000 },
          },
          {
            productName: "Galaxy S24 Ultra",
            reason:
              "優れたカメラ機能とゲーム性能を持つAndroidフラッグシップモデルです。",
            score: 92,
            features: ["200MPカメラ", "Snapdragon 8 Gen 3", "S Pen"],
            priceRange: { min: 85000, max: 100000 },
          },
          {
            productName: "Google Pixel 8 Pro",
            reason:
              "AI機能とカメラ性能に優れ、コストパフォーマンスが良いスマートフォンです。",
            score: 88,
            features: ["AI写真編集", "Tensor G3", "純正Android"],
            priceRange: { min: 75000, max: 90000 },
          },
        ],
      };

      const mockProducts = [
        {
          id: "product1",
          name: "iPhone 15 Pro Max 256GB",
          description: "Apple製最上位スマートフォン",
          features:
            "ProRAWカメラ、A17 Proチップ、120Hz ProMotion、チタニウムボディ",
          price: 105000,
          rating: 4.9,
          review_count: 300,
          rakuten_url: "https://item.rakuten.co.jp/test/iphone15promax/",
          image_url: "https://example.com/images/iphone15promax.jpg",
        },
        {
          id: "product2",
          name: "Galaxy S24 Ultra 512GB",
          description: "Samsung製フラッグシップスマートフォン",
          features: "200MPカメラ、Snapdragon 8 Gen 3、S Pen、大容量バッテリー",
          price: 95000,
          rating: 4.7,
          review_count: 220,
          rakuten_url: "https://item.rakuten.co.jp/test/galaxys24ultra/",
          image_url: "https://example.com/images/galaxys24ultra.jpg",
        },
        {
          id: "product3",
          name: "Google Pixel 8 Pro 128GB",
          description: "Google製AIスマートフォン",
          features: "AI写真編集、Tensor G3、純正Android、高速充電",
          price: 82000,
          rating: 4.5,
          review_count: 180,
          rakuten_url: "https://item.rakuten.co.jp/test/pixel8pro/",
          image_url: "https://example.com/images/pixel8pro.jpg",
        },
      ];

      // ステップ 2: モック設定
      // データベースモック
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.answer.findMany.mockResolvedValue(mockAnswers);
      mockPrisma.recommendation.findMany.mockResolvedValueOnce([]); // 重複チェック用
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.recommendation.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.$transaction.mockImplementation((callback: any) =>
        callback(mockPrisma)
      );

      // サービスモック
      const processedAnswers = [
        {
          questionId: "question1",
          questionText: "予算はどのくらいですか？",
          questionType: "SINGLE_CHOICE" as const,
          answer: { optionLabel: "10万円以下", optionValue: "100000" },
        },
        {
          questionId: "question2",
          questionText: "カメラ性能の重要度（1-100）",
          questionType: "RANGE" as const,
          answer: { rangeValue: 90 },
        },
        {
          questionId: "question3",
          questionText: "主な用途を教えてください",
          questionType: "TEXT" as const,
          answer: { textValue: "ゲームをよくプレイします" },
        },
      ];

      const aiInputData = {
        categoryName: "スマートフォン",
        userProfile: {
          preferences: {
            budget: "100000",
            cameraImportance: 90,
            usage: "ゲームをよくプレイします",
          },
        },
        answers: processedAnswers,
      };

      mockAnswerProcessor.processSessionAnswers.mockResolvedValue(
        processedAnswers
      );
      mockAnswerProcessor.structureForAI.mockResolvedValue(aiInputData);
      mockPromptGenerator.generatePrompt.mockResolvedValue(
        "ユーザーは30歳男性エンジニアで、予算10万円以下、カメラ性能重視（90/100）、ゲーム用途でスマートフォンを探しています。"
      );
      mockMastraAI.generateRecommendations.mockResolvedValue(mockAIResponse);
      mockMastraAI.validateResponse.mockReturnValue(true);

      // Product Mapper のモック設定
      mockProductMapper.mapWithConfidenceEvaluation
        .mockResolvedValueOnce({
          productId: "product1",
          confidence: 0.95,
          matchReasons: ["名前が完全一致", "価格帯が適切", "機能が一致"],
        })
        .mockResolvedValueOnce({
          productId: "product2",
          confidence: 0.92,
          matchReasons: ["名前が一致", "機能が一致"],
        })
        .mockResolvedValueOnce({
          productId: "product3",
          confidence: 0.88,
          matchReasons: ["名前が一致", "価格帯が適切"],
        });

      mockProductMapper.getMatchingStatistics.mockReturnValue({
        totalAttempts: 3,
        successfulMatches: 3,
        averageConfidence: 0.917,
      });

      // Recommendation Saver のモック設定
      mockRecommendationSaver.saveRecommendations.mockResolvedValue(undefined);

      // ステップ 3: POST /api/recommendations/generate の実行
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
      expect(generateData.data.recommendationsCount).toBe(3);
      expect(generateData.data.categoryName).toBe("スマートフォン");

      // ステップ 4: 生成されたレコメンドデータの準備（GET API用）
      const generatedRecommendations = [
        {
          id: "rec1",
          questionnaireSessionId: testSessionId,
          productId: "product1",
          rank: 1,
          score: 95,
          reason:
            "予算内で最高のカメラ性能とゲーム性能を提供するプレミアムスマートフォンです。",
          product: mockProducts[0],
        },
        {
          id: "rec2",
          questionnaireSessionId: testSessionId,
          productId: "product2",
          rank: 2,
          score: 92,
          reason:
            "優れたカメラ機能とゲーム性能を持つAndroidフラッグシップモデルです。",
          product: mockProducts[1],
        },
        {
          id: "rec3",
          questionnaireSessionId: testSessionId,
          productId: "product3",
          rank: 3,
          score: 88,
          reason:
            "AI機能とカメラ性能に優れ、コストパフォーマンスが良いスマートフォンです。",
          product: mockProducts[2],
        },
      ];

      // GET API用のモック設定
      mockPrisma.category.findUnique.mockResolvedValue({
        id: testCategoryId,
        name: "スマートフォン",
      });
      mockPrisma.recommendation.findMany.mockResolvedValue(
        generatedRecommendations
      );

      // ステップ 5: GET /api/recommendations/[sessionId] の実行
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

      // GET レスポンスの検証
      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data.recommendations).toHaveLength(3);
      expect(getData.data.total).toBe(3);

      // レコメンド内容の詳細検証
      const recommendations = getData.data.recommendations;

      // 第1位レコメンド
      expect(recommendations[0]).toEqual({
        id: "rec1",
        rank: 1,
        score: 95,
        reason:
          "予算内で最高のカメラ性能とゲーム性能を提供するプレミアムスマートフォンです。",
        product: {
          id: "product1",
          name: "iPhone 15 Pro Max 256GB",
          description: "Apple製最上位スマートフォン",
          price: 105000,
          rating: 4.9,
          features:
            "ProRAWカメラ、A17 Proチップ、120Hz ProMotion、チタニウムボディ",
          rakuten_url: "https://item.rakuten.co.jp/test/iphone15promax/",
          image_url: "https://example.com/images/iphone15promax.jpg",
        },
      });

      // 第2位レコメンド
      expect(recommendations[1]).toEqual({
        id: "rec2",
        rank: 2,
        score: 92,
        reason:
          "優れたカメラ機能とゲーム性能を持つAndroidフラッグシップモデルです。",
        product: {
          id: "product2",
          name: "Galaxy S24 Ultra 512GB",
          description: "Samsung製フラッグシップスマートフォン",
          price: 95000,
          rating: 4.7,
          features: "200MPカメラ、Snapdragon 8 Gen 3、S Pen、大容量バッテリー",
          rakuten_url: "https://item.rakuten.co.jp/test/galaxys24ultra/",
          image_url: "https://example.com/images/galaxys24ultra.jpg",
        },
      });

      // 第3位レコメンド
      expect(recommendations[2]).toEqual({
        id: "rec3",
        rank: 3,
        score: 88,
        reason:
          "AI機能とカメラ性能に優れ、コストパフォーマンスが良いスマートフォンです。",
        product: {
          id: "product3",
          name: "Google Pixel 8 Pro 128GB",
          description: "Google製AIスマートフォン",
          price: 82000,
          rating: 4.5,
          features: "AI写真編集、Tensor G3、純正Android、高速充電",
          rakuten_url: "https://item.rakuten.co.jp/test/pixel8pro/",
          image_url: "https://example.com/images/pixel8pro.jpg",
        },
      });

      // ステップ 6: サービス呼び出しの検証
      expect(mockAnswerProcessor.processSessionAnswers).toHaveBeenCalledWith(
        testSessionId
      );
      expect(mockAnswerProcessor.structureForAI).toHaveBeenCalledWith(
        processedAnswers
      );
      expect(mockPromptGenerator.generatePrompt).toHaveBeenCalledWith(
        testCategoryId,
        expect.objectContaining({
          fullName: "山田太郎",
          userId: testUserId,
        }),
        processedAnswers
      );
      expect(mockMastraAI.generateRecommendations).toHaveBeenCalledWith({
        prompt: expect.any(String),
        maxRecommendations: 10,
        temperature: 0.3,
      });
      expect(
        mockProductMapper.mapWithConfidenceEvaluation
      ).toHaveBeenCalledTimes(3);
      expect(mockRecommendationSaver.saveRecommendations).toHaveBeenCalledWith([
        {
          sessionId: testSessionId,
          productId: "product1",
          rank: 1,
          score: 95,
          reason:
            "予算内で最高のカメラ性能とゲーム性能を提供するプレミアムスマートフォンです。",
        },
        {
          sessionId: testSessionId,
          productId: "product2",
          rank: 2,
          score: 92,
          reason:
            "優れたカメラ機能とゲーム性能を持つAndroidフラッグシップモデルです。",
        },
        {
          sessionId: testSessionId,
          productId: "product3",
          rank: 3,
          score: 88,
          reason:
            "AI機能とカメラ性能に優れ、コストパフォーマンスが良いスマートフォンです。",
        },
      ]);
    });
  });

  describe("エラーシナリオテスト", () => {
    it("未完了セッションでエラーが適切に処理される", async () => {
      // 未完了セッションのモック設定
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "テストユーザー",
      };

      const incompleteSession = {
        id: testSessionId,
        status: "IN_PROGRESS", // 未完了
        categoryId: testCategoryId,
        userProfileId: testUserProfileId,
      };

      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(
        incompleteSession
      );

      // POST リクエストの実行
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

      // エラーレスポンスの検証
      expect(generateResponse.status).toBe(404);
      expect(generateData.success).toBe(false);
      expect(generateData.error).toBeDefined();
    });

    it("重複生成試行でエラーが適切に処理される", async () => {
      // 既存レコメンドがあるセッションのモック設定
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
        category: {
          id: testCategoryId,
          name: "スマートフォン",
        },
      };

      const existingRecommendations = [
        {
          id: "existing-rec1",
          questionnaireSessionId: testSessionId,
          productId: "product1",
          rank: 1,
          score: 90,
          reason: "既存のレコメンド",
        },
      ];

      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.recommendation.findMany.mockResolvedValue(
        existingRecommendations
      );

      // POST リクエストの実行
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

      // エラーレスポンスの検証
      expect(generateResponse.status).toBe(400);
      expect(generateData.success).toBe(false);
      expect(generateData.error).toBeDefined();
      expect(generateData.error.message).toContain("既に生成されています");
    });

    it("AI サービスエラーが適切に処理される", async () => {
      // 正常なセッションデータの準備
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
        category: {
          id: testCategoryId,
          name: "スマートフォン",
        },
      };

      const mockAnswers = [
        {
          id: "answer1",
          questionnaireSessionId: testSessionId,
          questionId: "question1",
          question: {
            id: "question1",
            text: "テスト質問",
            type: "SINGLE_CHOICE",
          },
          option: { id: "option1", label: "テストオプション", value: "test" },
        },
      ];

      // モック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.answer.findMany.mockResolvedValue(mockAnswers);
      mockPrisma.recommendation.findMany.mockResolvedValue([]); // 重複なし

      // サービスモック設定
      const processedAnswers = [
        {
          questionId: "question1",
          questionText: "テスト質問",
          questionType: "SINGLE_CHOICE" as const,
          answer: { optionLabel: "テストオプション", optionValue: "test" },
        },
      ];

      mockAnswerProcessor.processSessionAnswers.mockResolvedValue(
        processedAnswers
      );
      mockAnswerProcessor.structureForAI.mockResolvedValue({
        categoryName: "スマートフォン",
        userProfile: { preferences: {} },
        answers: processedAnswers,
      });
      mockPromptGenerator.generatePrompt.mockResolvedValue("テストプロンプト");

      // AI サービスエラーをシミュレート
      mockMastraAI.generateRecommendations.mockRejectedValue(
        new Error("AI サービスが利用できません")
      );

      // POST リクエストの実行
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

      // エラーレスポンスの検証
      expect(generateResponse.status).toBe(500);
      expect(generateData.success).toBe(false);
      expect(generateData.error).toBeDefined();
    });

    it("商品マッピング失敗が適切に処理される", async () => {
      // 正常なセッションデータの準備
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
        category: {
          id: testCategoryId,
          name: "スマートフォン",
        },
      };

      const mockAnswers = [
        {
          id: "answer1",
          questionnaireSessionId: testSessionId,
          questionId: "question1",
          question: {
            id: "question1",
            text: "テスト質問",
            type: "SINGLE_CHOICE",
          },
          option: { id: "option1", label: "テストオプション", value: "test" },
        },
      ];

      const mockAIResponse: AIRecommendationResponse = {
        recommendations: [
          {
            productName: "存在しない商品",
            reason: "テスト理由",
            score: 80,
            features: ["テスト機能"],
          },
        ],
      };

      // モック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.answer.findMany.mockResolvedValue(mockAnswers);
      mockPrisma.recommendation.findMany.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]); // 商品が見つからない

      // サービスモック設定
      const processedAnswers = [
        {
          questionId: "question1",
          questionText: "テスト質問",
          questionType: "SINGLE_CHOICE" as const,
          answer: { optionLabel: "テストオプション", optionValue: "test" },
        },
      ];

      mockAnswerProcessor.processSessionAnswers.mockResolvedValue(
        processedAnswers
      );
      mockAnswerProcessor.structureForAI.mockResolvedValue({
        categoryName: "スマートフォン",
        userProfile: { preferences: {} },
        answers: processedAnswers,
      });
      mockPromptGenerator.generatePrompt.mockResolvedValue("テストプロンプト");
      mockMastraAI.generateRecommendations.mockResolvedValue(mockAIResponse);
      mockMastraAI.validateResponse.mockReturnValue(true);

      // 商品マッピング失敗をシミュレート
      mockProductMapper.mapWithConfidenceEvaluation.mockResolvedValue(null);
      mockProductMapper.getMatchingStatistics.mockReturnValue({
        totalAttempts: 1,
        successfulMatches: 0,
        averageConfidence: 0,
      });

      // POST リクエストの実行
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

      // エラーレスポンスの検証（有効なレコメンドが0件の場合）
      expect(generateResponse.status).toBe(500);
      expect(generateData.success).toBe(false);
      expect(generateData.error).toBeDefined();
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量データでも適切な時間内で処理される", async () => {
      // 大量のテストデータ準備
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
        category: {
          id: testCategoryId,
          name: "スマートフォン",
        },
      };

      // 10個の回答を生成
      const mockAnswers = Array.from({ length: 10 }, (_, i) => ({
        id: `answer${i + 1}`,
        questionnaireSessionId: testSessionId,
        questionId: `question${i + 1}`,
        questionOptionId: `option${i + 1}`,
        range_value: null,
        text_value: null,
        question: {
          id: `question${i + 1}`,
          text: `質問${i + 1}`,
          type: "SINGLE_CHOICE",
        },
        option: {
          id: `option${i + 1}`,
          label: `選択肢${i + 1}`,
          value: `value${i + 1}`,
        },
      }));

      // 10個のAIレコメンドを生成
      const mockAIResponse: AIRecommendationResponse = {
        recommendations: Array.from({ length: 10 }, (_, i) => ({
          productName: `商品${i + 1}`,
          reason: `理由${i + 1}`,
          score: 90 - i,
          features: [`機能${i + 1}`],
        })),
      };

      // 10個の商品を生成
      const mockProducts = Array.from({ length: 10 }, (_, i) => ({
        id: `product${i + 1}`,
        name: `商品${i + 1}`,
        description: `説明${i + 1}`,
        features: `機能${i + 1}`,
        price: 50000 + i * 10000,
        rating: 4.0 + i * 0.1,
        review_count: 100 + i * 10,
        rakuten_url: `https://test${i + 1}.rakuten.co.jp/item`,
        image_url: `https://test${i + 1}.example.com/image.jpg`,
      }));

      // モック設定
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.answer.findMany.mockResolvedValue(mockAnswers);
      mockPrisma.recommendation.findMany.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.recommendation.createMany.mockResolvedValue({ count: 10 });
      mockPrisma.$transaction.mockImplementation((callback: any) =>
        callback(mockPrisma)
      );

      // サービスモック設定
      const processedAnswers = mockAnswers.map((answer, i) => ({
        questionId: `question${i + 1}`,
        questionText: `質問${i + 1}`,
        questionType: "SINGLE_CHOICE" as const,
        answer: { optionLabel: `選択肢${i + 1}`, optionValue: `value${i + 1}` },
      }));

      mockAnswerProcessor.processSessionAnswers.mockResolvedValue(
        processedAnswers
      );
      mockAnswerProcessor.structureForAI.mockResolvedValue({
        categoryName: "スマートフォン",
        userProfile: { preferences: {} },
        answers: processedAnswers,
      });
      mockPromptGenerator.generatePrompt.mockResolvedValue(
        "大量データテストプロンプト"
      );
      mockMastraAI.generateRecommendations.mockResolvedValue(mockAIResponse);
      mockMastraAI.validateResponse.mockReturnValue(true);

      // 商品マッピングを成功させる
      mockProducts.forEach((_, i) => {
        mockProductMapper.mapWithConfidenceEvaluation.mockResolvedValueOnce({
          productId: `product${i + 1}`,
          confidence: 0.8,
          matchReasons: ["テストマッチング"],
        });
      });

      mockProductMapper.getMatchingStatistics.mockReturnValue({
        totalAttempts: 10,
        successfulMatches: 10,
        averageConfidence: 0.8,
      });

      mockRecommendationSaver.saveRecommendations.mockResolvedValue(undefined);

      // パフォーマンステスト実行
      const startTime = Date.now();

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
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // パフォーマンス検証
      expect(generateResponse.status).toBe(200);
      expect(processingTime).toBeLessThan(30000); // 30秒以内

      const generateData = await generateResponse.json();
      expect(generateData.data.recommendationsCount).toBe(10);
    });
  });
});
