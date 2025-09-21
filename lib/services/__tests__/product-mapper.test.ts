/**
 * Product Mapper Service のテスト
 *
 * 商品マッピングサービスの各機能をテストします。
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  AIRecommendationItem,
  ProductMapperService,
} from "@/lib/types/ai-recommendations";

// Prisma のモック
const mockPrisma = {
  product: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// 設定のモック
vi.mock("@/lib/config/ai-recommendations", () => ({
  AI_RECOMMENDATION_CONFIG: {
    mappingThreshold: 0.7,
  },
}));

describe("ProductMapperService", () => {
  let service: ProductMapperService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPrisma.product.findMany.mockReset();
    mockPrisma.product.findFirst.mockReset();
    // 動的インポートでサービスを取得
    const { ProductMapperServiceImpl } = await import("../product-mapper");
    service = new ProductMapperServiceImpl();
  });

  describe("findSimilarProducts", () => {
    it("類似商品を信頼度順で返す", async () => {
      const mockProducts = [
        {
          id: "product1",
          name: "iPhone 15 Pro",
          description: "高性能スマートフォン",
          features: "防水、高性能カメラ",
          price: 150000,
          rating: 4.5,
          review_count: 100,
        },
        {
          id: "product2",
          name: "iPhone 15",
          description: "スマートフォン",
          features: "防水、カメラ",
          price: 120000,
          rating: 4.3,
          review_count: 80,
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const matches = await service.findSimilarProducts(
        "iPhone 15 Pro",
        ["防水", "高性能"],
        "category1",
        { min: 100000, max: 200000 }
      );

      expect(matches).toHaveLength(2);
      expect(matches[0].confidence).toBeGreaterThanOrEqual(
        matches[1].confidence
      );
      expect(matches[0].productId).toBe("product1");
    });

    it("商品が見つからない場合は空配列を返す", async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const matches = await service.findSimilarProducts(
        "存在しない商品",
        ["特徴"],
        "category1"
      );

      expect(matches).toHaveLength(0);
    });
  });

  describe("performFallbackMatching", () => {
    const mockAIRecommendation: AIRecommendationItem = {
      productName: "高性能スマートフォン",
      reason: "テスト理由",
      score: 85,
      features: ["防水", "高性能"],
      priceRange: { min: 100000, max: 200000 },
    };

    it("緩い条件でマッチが見つかった場合はそれを返す", async () => {
      const mockProducts = [
        {
          id: "product1",
          name: "スマートフォン ケース",
          description: "高性能な保護ケース",
          features: "防水機能",
          price: 150000,
          rating: 4.0,
          review_count: 50,
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.findFirst.mockResolvedValue(null);

      const match = await service.performFallbackMatching(
        mockAIRecommendation,
        "category1"
      );

      expect(match).not.toBeNull();
      expect(match?.productId).toBe("product1");
      expect(match?.matchReasons).toContain("緩い条件でのマッチング");
    });

    it("人気商品が見つかった場合はそれを返す", async () => {
      const mockPopularProduct = {
        id: "popular1",
        name: "人気スマートフォン",
        rating: 4.5,
        review_count: 200,
      };

      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.findFirst
        .mockResolvedValueOnce(mockPopularProduct) // 人気商品検索
        .mockResolvedValueOnce(null); // 価格範囲検索

      const match = await service.performFallbackMatching(
        mockAIRecommendation,
        "category1"
      );

      expect(match).not.toBeNull();
      expect(match?.productId).toBe("popular1");
      expect(match?.matchReasons).toContain("カテゴリ内の人気商品として提案");
    });

    it("価格範囲のみでマッチが見つかった場合はそれを返す", async () => {
      const mockPriceProduct = {
        id: "price1",
        name: "価格マッチ商品",
        price: 150000,
        rating: 4.0,
      };

      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.findFirst
        .mockResolvedValueOnce(null) // 人気商品検索
        .mockResolvedValueOnce(mockPriceProduct); // 価格範囲検索

      const match = await service.performFallbackMatching(
        mockAIRecommendation,
        "category1"
      );

      expect(match).not.toBeNull();
      expect(match?.productId).toBe("price1");
      expect(match?.matchReasons).toContain("価格範囲での条件マッチ");
    });

    it("何もマッチしない場合はnullを返す", async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.findFirst
        .mockResolvedValueOnce(null) // 人気商品検索
        .mockResolvedValueOnce(null); // 価格範囲検索

      const match = await service.performFallbackMatching(
        mockAIRecommendation,
        "category1"
      );

      expect(match).toBeNull();
    });
  });

  describe("getMatchingStatistics", () => {
    it("統計情報を正しく計算する", () => {
      const matches = [
        {
          productId: "1",
          confidence: 0.8,
          matchReasons: ["高信頼度マッチ"],
        },
        {
          productId: "2",
          confidence: 0.6,
          matchReasons: ["フォールバック処理による代替マッチング"],
        },
        null,
        {
          productId: "3",
          confidence: 0.9,
          matchReasons: ["高信頼度マッチ"],
        },
      ];

      const stats = service.getMatchingStatistics(matches);

      expect(stats.totalAttempts).toBe(4);
      expect(stats.successfulMatches).toBe(3);
      expect(stats.highConfidenceMatches).toBe(2); // 0.7以上
      expect(stats.fallbackMatches).toBe(1);
      expect(stats.successRate).toBe(0.75);
    });

    it("空の配列の場合は適切な統計を返す", () => {
      const stats = service.getMatchingStatistics([]);

      expect(stats.totalAttempts).toBe(0);
      expect(stats.successfulMatches).toBe(0);
      expect(stats.highConfidenceMatches).toBe(0);
      expect(stats.fallbackMatches).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe("mapAIRecommendationToProduct", () => {
    const mockAIRecommendation: AIRecommendationItem = {
      productName: "iPhone 15 Pro",
      reason: "高性能で写真撮影に最適",
      score: 90,
      features: ["防水", "高性能カメラ", "長時間バッテリー"],
      priceRange: { min: 120000, max: 180000 },
    };

    it("適切な商品マッチングを行う", async () => {
      const mockProducts = [
        {
          id: "product1",
          name: "iPhone 15 Pro 128GB",
          description: "最新の高性能スマートフォン",
          features: "防水、高性能カメラ、A17 Proチップ",
          price: 150000,
          rating: 4.8,
          review_count: 250,
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const match = await service.mapAIRecommendationToProduct(
        mockAIRecommendation,
        "category1"
      );

      expect(match).not.toBeNull();
      expect(match?.productId).toBe("product1");
      expect(match?.confidence).toBeGreaterThan(0);
    });

    it("マッチする商品がない場合はnullを返す", async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.findFirst.mockResolvedValue(null);

      const match = await service.mapAIRecommendationToProduct(
        mockAIRecommendation,
        "category1"
      );

      expect(match).toBeNull();
    });
  });
});
