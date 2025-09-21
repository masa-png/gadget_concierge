/**
 * AI Response Analyzer のテスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AIResponseAnalyzer } from "../ai-response-analyzer";

describe("AIResponseAnalyzer", () => {
  let analyzer: AIResponseAnalyzer;

  beforeEach(() => {
    analyzer = new AIResponseAnalyzer();
  });

  describe("analyzeResponse", () => {
    it("有効なレスポンスを正しく分析する", async () => {
      const validResponse = {
        recommendations: [
          {
            productName: "iPhone 15 Pro",
            reason:
              "高性能なカメラと処理能力を持つスマートフォンで、写真撮影を重視するユーザーに最適です。",
            score: 0.9,
            features: ["高性能カメラ", "A17 Pro チップ", "チタニウム素材"],
            priceRange: { min: 150000, max: 200000 },
          },
          {
            productName: "Samsung Galaxy S24",
            reason:
              "Android の最新機能と優れたディスプレイを搭載したスマートフォンです。",
            score: 0.8,
            features: ["Dynamic AMOLED", "AI カメラ", "長時間バッテリー"],
            priceRange: { min: 120000, max: 180000 },
          },
        ],
      };

      const result = await analyzer.analyzeResponse(validResponse);

      expect(result.isValid).toBe(true);
      expect(result.qualityScore).toBeGreaterThan(0.7);
      expect(result.normalizedResponse.recommendations).toHaveLength(2);
      expect(result.metadata.totalRecommendations).toBe(2);
      expect(result.metadata.averageScore).toBeCloseTo(0.85, 2);
      expect(
        result.issues.filter((issue) => issue.type === "ERROR")
      ).toHaveLength(0);
    });

    it("配列形式のレスポンスを正しく処理する", async () => {
      const arrayResponse = [
        {
          productName: "MacBook Pro",
          reason: "プロフェッショナル向けの高性能ノートパソコンです。",
          score: 0.95,
          features: ["M3 チップ", "Retina ディスプレイ"],
        },
      ];

      const result = await analyzer.analyzeResponse(arrayResponse);

      expect(result.isValid).toBe(true);
      expect(result.normalizedResponse.recommendations).toHaveLength(1);
      expect(result.normalizedResponse.recommendations[0].productName).toBe(
        "MacBook Pro"
      );
    });

    it("null レスポンスを適切にエラーとして処理する", async () => {
      const result = await analyzer.analyzeResponse(null);

      expect(result.isValid).toBe(false);
      expect(result.qualityScore).toBe(0);
      expect(
        result.issues.some((issue) => issue.code === "NULL_RESPONSE")
      ).toBe(true);
    });

    it("無効な型のレスポンスを適切にエラーとして処理する", async () => {
      const result = await analyzer.analyzeResponse("invalid string response");

      expect(result.isValid).toBe(false);
      expect(result.issues.some((issue) => issue.code === "INVALID_TYPE")).toBe(
        true
      );
    });

    it("recommendations プロパティが欠けているレスポンスをエラーとして処理する", async () => {
      const invalidResponse = {
        data: [],
        status: "success",
      };

      const result = await analyzer.analyzeResponse(invalidResponse);

      expect(result.isValid).toBe(false);
      expect(
        result.issues.some((issue) => issue.code === "MISSING_RECOMMENDATIONS")
      ).toBe(true);
    });

    it("短い商品名に対して警告を発行する", async () => {
      const responseWithShortName = {
        recommendations: [
          {
            productName: "PC", // 短すぎる名前
            reason:
              "高性能なパーソナルコンピューターです。プロフェッショナルな作業に最適。",
            score: 0.8,
            features: ["高性能", "軽量"],
          },
        ],
      };

      const result = await analyzer.analyzeResponse(responseWithShortName);

      expect(result.isValid).toBe(true); // 警告なのでまだ有効
      expect(
        result.issues.some((issue) => issue.code === "SHORT_PRODUCT_NAME")
      ).toBe(true);
    });

    it("短い推薦理由に対して警告を発行する", async () => {
      const responseWithShortReason = {
        recommendations: [
          {
            productName: "素晴らしいスマートフォン",
            reason: "良い商品です。", // 短すぎる理由
            score: 0.8,
            features: ["高性能", "軽量"],
          },
        ],
      };

      const result = await analyzer.analyzeResponse(responseWithShortReason);

      expect(result.isValid).toBe(true);
      expect(result.issues.some((issue) => issue.code === "SHORT_REASON")).toBe(
        true
      );
    });

    it("低いスコアに対して警告を発行する", async () => {
      const responseWithLowScore = {
        recommendations: [
          {
            productName: "普通のスマートフォン",
            reason:
              "基本的な機能を持つスマートフォンです。価格は手頃ですが、性能は限定的です。",
            score: 0.05, // 低いスコア
            features: ["基本機能"],
          },
        ],
      };

      const result = await analyzer.analyzeResponse(responseWithLowScore);

      expect(result.isValid).toBe(true);
      expect(result.issues.some((issue) => issue.code === "LOW_SCORE")).toBe(
        true
      );
    });

    it("特徴が空の場合に警告を発行する", async () => {
      const responseWithNoFeatures = {
        recommendations: [
          {
            productName: "特徴不明のスマートフォン",
            reason:
              "詳細な特徴は不明ですが、基本的なスマートフォン機能を提供します。",
            score: 0.6,
            features: [], // 空の特徴配列
          },
        ],
      };

      const result = await analyzer.analyzeResponse(responseWithNoFeatures);

      expect(result.isValid).toBe(true);
      expect(result.issues.some((issue) => issue.code === "NO_FEATURES")).toBe(
        true
      );
    });

    it("重複する商品名に対して警告を発行する", async () => {
      const responseWithDuplicates = {
        recommendations: [
          {
            productName: "iPhone 15",
            reason: "最新のiPhoneです。",
            score: 0.9,
            features: ["高性能"],
          },
          {
            productName: "iPhone 15", // 重複
            reason: "同じく最新のiPhoneです。",
            score: 0.85,
            features: ["高性能"],
          },
        ],
      };

      const result = await analyzer.analyzeResponse(responseWithDuplicates);

      expect(result.isValid).toBe(true);
      expect(
        result.issues.some((issue) => issue.code === "DUPLICATE_PRODUCTS")
      ).toBe(true);
    });

    it("異なるフィールド名を正規化する", async () => {
      const responseWithDifferentFieldNames = {
        recommendations: [
          {
            product_name: "代替フィールド名のスマートフォン", // アンダースコア形式
            description: "product_name と description を使用したレスポンス",
            confidence: 0.75, // score の代わり
            tags: ["タグ1", "タグ2"], // features の代わり
            price_range: { min: 50000, max: 100000 }, // アンダースコア形式
          },
        ],
      };

      const result = await analyzer.analyzeResponse(
        responseWithDifferentFieldNames
      );

      expect(result.isValid).toBe(true);
      expect(result.normalizedResponse.recommendations[0].productName).toBe(
        "代替フィールド名のスマートフォン"
      );
      expect(result.normalizedResponse.recommendations[0].reason).toBe(
        "product_name と description を使用したレスポンス"
      );
      expect(result.normalizedResponse.recommendations[0].score).toBe(0.75);
      expect(result.normalizedResponse.recommendations[0].features).toEqual([
        "タグ1",
        "タグ2",
      ]);
      expect(result.normalizedResponse.recommendations[0].priceRange).toEqual({
        min: 50000,
        max: 100000,
      });
    });

    it("カンマ区切りの特徴文字列を配列に変換する", async () => {
      const responseWithStringFeatures = {
        recommendations: [
          {
            productName: "文字列特徴のスマートフォン",
            reason: "特徴が文字列形式で提供されるスマートフォンです。",
            score: 0.8,
            features: "高性能カメラ, 長時間バッテリー, 防水機能", // カンマ区切り文字列
          },
        ],
      };

      const result = await analyzer.analyzeResponse(responseWithStringFeatures);

      expect(result.isValid).toBe(true);
      expect(result.normalizedResponse.recommendations[0].features).toEqual([
        "高性能カメラ",
        "長時間バッテリー",
        "防水機能",
      ]);
    });

    it("無効な価格範囲を適切に処理する", async () => {
      const responseWithInvalidPriceRange = {
        recommendations: [
          {
            productName: "価格範囲無効のスマートフォン",
            reason: "価格範囲が無効なスマートフォンです。",
            score: 0.7,
            features: ["基本機能"],
            priceRange: { min: 100000, max: 50000 }, // max < min
          },
        ],
      };

      const result = await analyzer.analyzeResponse(
        responseWithInvalidPriceRange
      );

      expect(result.isValid).toBe(false);
      expect(result.issues.some((issue) => issue.type === "ERROR")).toBe(true);
    });

    it("メタデータを正しく生成する", async () => {
      const response = {
        recommendations: [
          {
            productName: "商品1",
            reason: "理由1です。",
            score: 0.9,
            features: ["特徴1"],
          },
          {
            productName: "商品2",
            reason: "理由2です。",
            score: 0.7,
            features: ["特徴2"],
          },
          {
            productName: "商品3",
            reason: "理由3です。",
            score: 0.4,
            features: ["特徴3"],
          },
        ],
      };

      const result = await analyzer.analyzeResponse(response);

      expect(result.metadata.totalRecommendations).toBe(3);
      expect(result.metadata.averageScore).toBeCloseTo(0.67, 1);
      expect(result.metadata.scoreDistribution.high).toBe(1); // score >= 0.8
      expect(result.metadata.scoreDistribution.medium).toBe(1); // 0.5 <= score < 0.8
      expect(result.metadata.scoreDistribution.low).toBe(1); // score < 0.5
      expect(result.metadata.hasIncompleteData).toBe(false);
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it("品質スコアを正しく計算する", async () => {
      // 高品質なレスポンス
      const highQualityResponse = {
        recommendations: [
          {
            productName: "高品質スマートフォン",
            reason:
              "非常に詳細で説得力のある推薦理由を提供します。このスマートフォンは最新技術を搭載しています。",
            score: 0.95,
            features: ["高性能カメラ", "長時間バッテリー", "高速プロセッサ"],
          },
          {
            productName: "もう一つの高品質スマートフォン",
            reason:
              "こちらも詳細な推薦理由があります。ユーザーのニーズに完璧に合致する製品です。",
            score: 0.9,
            features: ["優れたディスプレイ", "防水機能", "ワイヤレス充電"],
          },
        ],
      };

      const result = await analyzer.analyzeResponse(highQualityResponse);
      expect(result.qualityScore).toBeGreaterThan(0.8);
    });
  });
});
