/**
 * シンプルなエンドツーエンドレコメンドテスト
 *
 * 主要な統合ポイントをテストし、エラーシナリオでの適切な処理確認を実装します。
 * 要件: 全要件の統合テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/recommendations/[sessionId]/route";

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
    recommendation: {
      findMany: vi.fn(),
    },
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

describe("シンプルなエンドツーエンドレコメンドテスト", () => {
  let mockPrisma: any;

  const testSessionId = "e2e-test-session-123";
  const testUserId = "test-user-123";
  const testUserProfileId = "test-user-profile-123";
  const testCategoryId = "smartphone-category";

  beforeEach(async () => {
    vi.clearAllMocks();

    // Prisma モックの取得
    const { prisma } = await import("@/lib/prisma");
    mockPrisma = prisma;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("レコメンド取得の統合テスト", () => {
    it("完全なレコメンドデータが正しい形式で取得できる", async () => {
      // テストデータの準備
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "山田太郎",
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

      // 実際のレコメンド生成結果を模擬したデータ
      const mockRecommendations = [
        {
          id: "rec1",
          questionnaireSessionId: testSessionId,
          productId: "product1",
          rank: 1,
          score: 95,
          reason:
            "予算内で最高のカメラ性能とゲーム性能を提供するプレミアムスマートフォンです。A17 Proチップにより、最新ゲームも快適にプレイできます。",
          product: {
            id: "product1",
            name: "iPhone 15 Pro Max 256GB",
            description:
              "Apple製最上位スマートフォン。ProRAWカメラとA17 Proチップを搭載し、プロレベルの写真撮影とゲーミング性能を実現。",
            price: 105000,
            rating: 4.9,
            features:
              "ProRAWカメラ、A17 Proチップ、120Hz ProMotion、チタニウムボディ、防水機能",
            rakuten_url: "https://item.rakuten.co.jp/apple/iphone15promax256/",
            image_url: "https://images.example.com/iphone15promax.jpg",
          },
        },
        {
          id: "rec2",
          questionnaireSessionId: testSessionId,
          productId: "product2",
          rank: 2,
          score: 92,
          reason:
            "優れたカメラ機能とゲーム性能を持つAndroidフラッグシップモデル。S Penによる多彩な操作も魅力的です。",
          product: {
            id: "product2",
            name: "Galaxy S24 Ultra 512GB",
            description:
              "Samsung製フラッグシップスマートフォン。200MPカメラとSnapdragon 8 Gen 3を搭載し、プロ級の撮影とパフォーマンスを提供。",
            price: 95000,
            rating: 4.7,
            features:
              "200MPカメラ、Snapdragon 8 Gen 3、S Pen、大容量バッテリー、防水機能",
            rakuten_url:
              "https://item.rakuten.co.jp/samsung/galaxys24ultra512/",
            image_url: "https://images.example.com/galaxys24ultra.jpg",
          },
        },
        {
          id: "rec3",
          questionnaireSessionId: testSessionId,
          productId: "product3",
          rank: 3,
          score: 88,
          reason:
            "AI機能とカメラ性能に優れ、コストパフォーマンスが良いスマートフォン。純正Androidの快適な操作性も魅力です。",
          product: {
            id: "product3",
            name: "Google Pixel 8 Pro 128GB",
            description:
              "Google製AIスマートフォン。Tensor G3チップとAI写真編集機能により、誰でも簡単にプロ級の写真が撮影できます。",
            price: 82000,
            rating: 4.5,
            features: "AI写真編集、Tensor G3、純正Android、高速充電、防水機能",
            rakuten_url: "https://item.rakuten.co.jp/google/pixel8pro128/",
            image_url: "https://images.example.com/pixel8pro.jpg",
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

      // レスポンスの基本検証
      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data).toBeDefined();

      // セッション情報の検証
      expect(getData.data.session).toEqual({
        id: testSessionId,
        categoryId: testCategoryId,
        categoryName: "スマートフォン",
        status: "COMPLETED",
        completed_at: "2024-01-15T10:00:00.000Z",
      });

      // レコメンド情報の検証
      expect(getData.data.recommendations).toHaveLength(3);
      expect(getData.data.total).toBe(3);

      // 各レコメンドの詳細検証
      const recommendations = getData.data.recommendations;

      // 第1位レコメンド（iPhone 15 Pro Max）
      expect(recommendations[0]).toEqual({
        id: "rec1",
        rank: 1,
        score: 95,
        reason:
          "予算内で最高のカメラ性能とゲーム性能を提供するプレミアムスマートフォンです。A17 Proチップにより、最新ゲームも快適にプレイできます。",
        product: {
          id: "product1",
          name: "iPhone 15 Pro Max 256GB",
          description:
            "Apple製最上位スマートフォン。ProRAWカメラとA17 Proチップを搭載し、プロレベルの写真撮影とゲーミング性能を実現。",
          price: 105000,
          rating: 4.9,
          features:
            "ProRAWカメラ、A17 Proチップ、120Hz ProMotion、チタニウムボディ、防水機能",
          rakuten_url: "https://item.rakuten.co.jp/apple/iphone15promax256/",
          image_url: "https://images.example.com/iphone15promax.jpg",
        },
      });

      // 第2位レコメンド（Galaxy S24 Ultra）
      expect(recommendations[1]).toEqual({
        id: "rec2",
        rank: 2,
        score: 92,
        reason:
          "優れたカメラ機能とゲーム性能を持つAndroidフラッグシップモデル。S Penによる多彩な操作も魅力的です。",
        product: {
          id: "product2",
          name: "Galaxy S24 Ultra 512GB",
          description:
            "Samsung製フラッグシップスマートフォン。200MPカメラとSnapdragon 8 Gen 3を搭載し、プロ級の撮影とパフォーマンスを提供。",
          price: 95000,
          rating: 4.7,
          features:
            "200MPカメラ、Snapdragon 8 Gen 3、S Pen、大容量バッテリー、防水機能",
          rakuten_url: "https://item.rakuten.co.jp/samsung/galaxys24ultra512/",
          image_url: "https://images.example.com/galaxys24ultra.jpg",
        },
      });

      // 第3位レコメンド（Google Pixel 8 Pro）
      expect(recommendations[2]).toEqual({
        id: "rec3",
        rank: 3,
        score: 88,
        reason:
          "AI機能とカメラ性能に優れ、コストパフォーマンスが良いスマートフォン。純正Androidの快適な操作性も魅力です。",
        product: {
          id: "product3",
          name: "Google Pixel 8 Pro 128GB",
          description:
            "Google製AIスマートフォン。Tensor G3チップとAI写真編集機能により、誰でも簡単にプロ級の写真が撮影できます。",
          price: 82000,
          rating: 4.5,
          features: "AI写真編集、Tensor G3、純正Android、高速充電、防水機能",
          rakuten_url: "https://item.rakuten.co.jp/google/pixel8pro128/",
          image_url: "https://images.example.com/pixel8pro.jpg",
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

    it("複数カテゴリのレコメンドが適切に処理される", async () => {
      // 異なるカテゴリのテストケース
      const laptopSessionId = "laptop-session-123";
      const laptopCategoryId = "laptop-category";

      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "田中花子",
      };

      const mockSession = {
        id: laptopSessionId,
        status: "COMPLETED",
        categoryId: laptopCategoryId,
        userProfileId: testUserProfileId,
        completed_at: new Date("2024-01-20T15:30:00Z"),
      };

      const mockCategory = {
        id: laptopCategoryId,
        name: "ノートパソコン",
      };

      const mockRecommendations = [
        {
          id: "laptop-rec1",
          questionnaireSessionId: laptopSessionId,
          productId: "laptop-product1",
          rank: 1,
          score: 93,
          reason:
            "軽量で高性能なビジネス向けノートパソコン。長時間のバッテリー駆動と優れた携帯性を実現しています。",
          product: {
            id: "laptop-product1",
            name: "MacBook Air M3 13インチ 256GB",
            description:
              "Apple製超軽量ノートパソコン。M3チップにより高いパフォーマンスと省電力を両立。",
            price: 148000,
            rating: 4.8,
            features:
              "M3チップ、18時間バッテリー、軽量1.24kg、Liquid Retinaディスプレイ",
            rakuten_url: "https://item.rakuten.co.jp/apple/macbookair-m3-256/",
            image_url: "https://images.example.com/macbookair-m3.jpg",
          },
        },
        {
          id: "laptop-rec2",
          questionnaireSessionId: laptopSessionId,
          productId: "laptop-product2",
          rank: 2,
          score: 90,
          reason:
            "コストパフォーマンスに優れたWindows搭載ノートパソコン。ビジネス用途に最適な機能を搭載。",
          product: {
            id: "laptop-product2",
            name: "ThinkPad X1 Carbon Gen 11",
            description:
              "Lenovo製ビジネスノートパソコン。堅牢性と軽量性を両立し、長時間の作業に最適。",
            price: 135000,
            rating: 4.6,
            features:
              "Intel Core i7、16GB RAM、512GB SSD、14インチ、軽量1.12kg",
            rakuten_url:
              "https://item.rakuten.co.jp/lenovo/thinkpad-x1-carbon-gen11/",
            image_url: "https://images.example.com/thinkpad-x1-carbon.jpg",
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
        `http://localhost:3000/api/recommendations/${laptopSessionId}`,
        {
          method: "GET",
        }
      );

      const getResponse = await GET(getRequest, {
        params: { sessionId: laptopSessionId },
      });
      const getData = await getResponse.json();

      // レスポンスの検証
      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data.session.categoryName).toBe("ノートパソコン");
      expect(getData.data.recommendations).toHaveLength(2);
      expect(getData.data.recommendations[0].product.name).toBe(
        "MacBook Air M3 13インチ 256GB"
      );
      expect(getData.data.recommendations[1].product.name).toBe(
        "ThinkPad X1 Carbon Gen 11"
      );
    });
  });

  describe("エラーシナリオの統合テスト", () => {
    it("存在しないセッションで適切なエラーが返される", async () => {
      const nonExistentSessionId = "non-existent-session-456";

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

    it("ユーザープロフィールが存在しない場合のエラー処理", async () => {
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

    it("データベースエラーが適切に処理される", async () => {
      // データベースエラーをシミュレート
      mockPrisma.userProfile.findUnique.mockRejectedValue(
        new Error("Database connection failed")
      );

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
      expect(getResponse.status).toBe(500);
      expect(getData.success).toBe(false);
      expect(getData.error).toBeDefined();
      expect(getData.error.message).toContain("エラーが発生しました");
    });
  });

  describe("データ品質の統合テスト", () => {
    it("レコメンドデータの整合性が保たれている", async () => {
      // テストデータの準備
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "データ品質テストユーザー",
      };

      const mockSession = {
        id: testSessionId,
        status: "COMPLETED",
        categoryId: testCategoryId,
        userProfileId: testUserProfileId,
        completed_at: new Date("2024-01-25T12:00:00Z"),
      };

      const mockCategory = {
        id: testCategoryId,
        name: "スマートフォン",
      };

      // 様々なスコアとランクのレコメンド
      const mockRecommendations = [
        {
          id: "quality-rec1",
          questionnaireSessionId: testSessionId,
          productId: "quality-product1",
          rank: 1,
          score: 98.5,
          reason:
            "最高評価の商品です。すべての要件を満たし、優れた性能を提供します。",
          product: {
            id: "quality-product1",
            name: "Premium Smartphone Pro",
            description: "最高級スマートフォン",
            price: 120000,
            rating: 4.9,
            features: "最新技術、高性能カメラ、長時間バッテリー",
            rakuten_url: "https://item.rakuten.co.jp/premium/smartphone-pro/",
            image_url: "https://images.example.com/premium-smartphone.jpg",
          },
        },
        {
          id: "quality-rec2",
          questionnaireSessionId: testSessionId,
          productId: "quality-product2",
          rank: 2,
          score: 85.2,
          reason:
            "バランスの取れた良い商品です。コストパフォーマンスに優れています。",
          product: {
            id: "quality-product2",
            name: "Standard Smartphone Plus",
            description: "標準的なスマートフォン",
            price: 80000,
            rating: 4.5,
            features: "標準機能、良好なカメラ、適度なバッテリー",
            rakuten_url: "https://item.rakuten.co.jp/standard/smartphone-plus/",
            image_url: "https://images.example.com/standard-smartphone.jpg",
          },
        },
        {
          id: "quality-rec3",
          questionnaireSessionId: testSessionId,
          productId: "quality-product3",
          rank: 3,
          score: 72.8,
          reason:
            "エントリーレベルの商品です。基本的な機能は十分に備えています。",
          product: {
            id: "quality-product3",
            name: "Basic Smartphone Lite",
            description: "基本的なスマートフォン",
            price: 50000,
            rating: 4.0,
            features: "基本機能、シンプルなカメラ、標準バッテリー",
            rakuten_url: "https://item.rakuten.co.jp/basic/smartphone-lite/",
            image_url: "https://images.example.com/basic-smartphone.jpg",
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

      // データ品質の検証
      expect(getResponse.status).toBe(200);
      expect(getData.data.recommendations).toHaveLength(3);

      const recommendations = getData.data.recommendations;

      // ランクの順序性検証
      expect(recommendations[0].rank).toBe(1);
      expect(recommendations[1].rank).toBe(2);
      expect(recommendations[2].rank).toBe(3);

      // スコアの降順検証
      expect(recommendations[0].score).toBeGreaterThan(
        recommendations[1].score
      );
      expect(recommendations[1].score).toBeGreaterThan(
        recommendations[2].score
      );

      // 必須フィールドの存在検証
      // eslint-disable-next-line @typescript-eslint/no - explicit - any;
      recommendations.forEach((rec: any, index: number) => {
        expect(rec.id).toBeDefined();
        expect(rec.rank).toBe(index + 1);
        expect(rec.score).toBeGreaterThan(0);
        expect(rec.reason).toBeDefined();
        expect(rec.reason.length).toBeGreaterThan(10); // 理由は十分な長さがある

        expect(rec.product.id).toBeDefined();
        expect(rec.product.name).toBeDefined();
        expect(rec.product.description).toBeDefined();
        expect(rec.product.price).toBeGreaterThan(0);
        expect(rec.product.rating).toBeGreaterThanOrEqual(0);
        expect(rec.product.rating).toBeLessThanOrEqual(5);
        expect(rec.product.features).toBeDefined();
        expect(rec.product.rakuten_url).toMatch(/^https?:\/\//);
        expect(rec.product.image_url).toMatch(/^https?:\/\//);
      });

      // 価格とスコアの相関検証（高スコア商品は高価格傾向）
      expect(recommendations[0].product.price).toBeGreaterThan(
        recommendations[2].product.price
      );
    });

    it("空のレコメンドリストが適切に処理される", async () => {
      // テストデータの準備
      const mockUserProfile = {
        id: testUserProfileId,
        userId: testUserId,
        full_name: "空リストテストユーザー",
      };

      const mockSession = {
        id: testSessionId,
        status: "COMPLETED",
        categoryId: testCategoryId,
        userProfileId: testUserProfileId,
        completed_at: new Date("2024-01-30T09:00:00Z"),
      };

      const mockCategory = {
        id: testCategoryId,
        name: "スマートフォン",
      };

      // モック設定（空のレコメンドリスト）
      mockPrisma.userProfile.findUnique.mockResolvedValue(mockUserProfile);
      mockPrisma.questionnaireSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.recommendation.findMany.mockResolvedValue([]);

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

      // 空リストの適切な処理検証
      expect(getResponse.status).toBe(200);
      expect(getData.success).toBe(true);
      expect(getData.data.recommendations).toEqual([]);
      expect(getData.data.total).toBe(0);
      expect(getData.data.session).toBeDefined();
      expect(getData.data.session.categoryName).toBe("スマートフォン");
    });
  });
});
