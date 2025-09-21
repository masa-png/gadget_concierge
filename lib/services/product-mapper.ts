/**
 * Product Mapping Service
 *
 * このサービスは、AI が生成したレコメンド内容を既存の Product テーブル内の商品にマッピングします。
 * 商品名、説明、特徴による検索機能と、ProductCategory テーブルを活用したカテゴリ絞り込み機能を提供します。
 */

import { prisma } from "@/lib/prisma";
import { AI_RECOMMENDATION_CONFIG } from "@/lib/config/ai-recommendations";
import type { Prisma } from "@prisma/client";
import type {
  AIRecommendationItem,
  ProductMatch,
  ProductMapperService,
} from "@/lib/types/ai-recommendations";

/**
 * 商品検索で使用される商品データの型定義
 */
type ProductSearchResult = {
  id: string;
  name: string;
  description: string | null;
  features: string;
  price: Prisma.Decimal | null;
  rating: Prisma.Decimal | null;
  review_count: number | null;
};

/**
 * 商品検索の重み付け設定
 */
const SEARCH_WEIGHTS = {
  exactNameMatch: 1.0,
  partialNameMatch: 0.8,
  descriptionMatch: 0.6,
  featuresMatch: 0.7,
  categoryMatch: 0.5,
  priceRangeMatch: 0.4,
} as const;

/**
 * 商品マッピングサービスの実装
 */
export class ProductMapperServiceImpl implements ProductMapperService {
  /**
   * AI レコメンドアイテムを既存商品にマッピングします
   * @param aiRecommendation AI が生成したレコメンドアイテム
   * @param categoryId 対象カテゴリID
   * @returns マッチした商品情報または null
   */
  async mapAIRecommendationToProduct(
    aiRecommendation: AIRecommendationItem,
    categoryId: string
  ): Promise<ProductMatch | null> {
    try {
      // 類似商品を検索
      const matches = await this.findSimilarProducts(
        aiRecommendation.productName,
        aiRecommendation.features,
        categoryId,
        aiRecommendation.priceRange
      );

      // 最も信頼度の高いマッチを選択
      const bestMatch = matches[0];

      if (
        !bestMatch ||
        bestMatch.confidence < AI_RECOMMENDATION_CONFIG.mappingThreshold
      ) {
        return null;
      }

      return bestMatch;
    } catch (error) {
      console.error("商品マッピング中にエラーが発生しました:", error);
      throw new Error(
        `商品マッピングに失敗しました: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );
    }
  }

  /**
   * 商品名、特徴、カテゴリ、価格範囲に基づいて類似商品を検索します
   * @param name 商品名
   * @param features 商品特徴の配列
   * @param categoryId カテゴリID
   * @param priceRange 価格範囲（オプション）
   * @returns マッチした商品の配列（信頼度順）
   */
  async findSimilarProducts(
    name: string,
    features: string[],
    categoryId: string,
    priceRange?: { min: number; max: number }
  ): Promise<ProductMatch[]> {
    try {
      // カテゴリに属する商品を取得
      const products = await this.getProductsByCategory(categoryId, priceRange);

      if (products.length === 0) {
        return [];
      }

      // 各商品の信頼度スコアを計算
      const matches: ProductMatch[] = [];

      for (const product of products) {
        const confidence = this.calculateConfidenceScore(
          name,
          features,
          product,
          priceRange
        );

        if (confidence > 0) {
          const matchReasons = this.generateMatchReasons(
            name,
            features,
            product,
            priceRange
          );

          matches.push({
            productId: product.id,
            confidence,
            matchReasons,
          });
        }
      }

      // 信頼度順でソート
      return matches.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("類似商品検索中にエラーが発生しました:", error);
      throw new Error(
        `類似商品検索に失敗しました: ${
          error instanceof Error ? error.message : "不明なエラー"
        }`
      );
    }
  }

  /**
   * カテゴリに属する商品を取得します（価格範囲フィルタ付き）
   * @param categoryId カテゴリID
   * @param priceRange 価格範囲（オプション）
   * @returns 商品の配列
   */
  private async getProductsByCategory(
    categoryId: string,
    priceRange?: { min: number; max: number }
  ) {
    const whereClause: Prisma.ProductWhereInput = {
      productCategories: {
        some: {
          categoryId: categoryId,
        },
      },
      availability: 1, // 在庫ありの商品のみ
    };

    // 価格範囲フィルタを追加
    if (priceRange) {
      whereClause.price = {
        gte: priceRange.min,
        lte: priceRange.max,
      };
    }

    return await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        features: true,
        price: true,
        rating: true,
        review_count: true,
      },
      // パフォーマンス向上のため上位1000件に制限
      take: 1000,
    });
  }

  /**
   * 商品の信頼度スコアを計算します
   * @param searchName 検索対象の商品名
   * @param searchFeatures 検索対象の特徴配列
   * @param product 比較対象の商品
   * @param priceRange 価格範囲（オプション）
   * @returns 信頼度スコア（0.0 - 1.0）
   */
  private calculateConfidenceScore(
    searchName: string,
    searchFeatures: string[],
    product: ProductSearchResult,
    priceRange?: { min: number; max: number }
  ): number {
    let totalScore = 0;
    let maxPossibleScore = 0;

    // 商品名マッチング
    const nameScore = this.calculateNameMatchScore(searchName, product.name);
    totalScore += nameScore * SEARCH_WEIGHTS.exactNameMatch;
    maxPossibleScore += SEARCH_WEIGHTS.exactNameMatch;

    // 説明マッチング
    if (product.description) {
      const descriptionScore = this.calculateTextMatchScore(
        searchName,
        product.description
      );
      totalScore += descriptionScore * SEARCH_WEIGHTS.descriptionMatch;
      maxPossibleScore += SEARCH_WEIGHTS.descriptionMatch;
    }

    // 特徴マッチング
    if (searchFeatures.length > 0) {
      const featuresScore = this.calculateFeaturesMatchScore(
        searchFeatures,
        product.features
      );
      totalScore += featuresScore * SEARCH_WEIGHTS.featuresMatch;
      maxPossibleScore += SEARCH_WEIGHTS.featuresMatch;
    }

    // 価格範囲マッチング
    if (priceRange && product.price) {
      const priceScore = this.calculatePriceMatchScore(
        priceRange,
        Number(product.price)
      );
      totalScore += priceScore * SEARCH_WEIGHTS.priceRangeMatch;
      maxPossibleScore += SEARCH_WEIGHTS.priceRangeMatch;
    }

    // 正規化された信頼度スコアを返す
    return maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
  }

  /**
   * 商品名のマッチングスコアを計算します
   * @param searchName 検索対象の商品名
   * @param productName 商品の名前
   * @returns マッチングスコア（0.0 - 1.0）
   */
  private calculateNameMatchScore(
    searchName: string,
    productName: string
  ): number {
    const normalizedSearch = this.normalizeText(searchName);
    const normalizedProduct = this.normalizeText(productName);

    // 完全一致
    if (normalizedSearch === normalizedProduct) {
      return 1.0;
    }

    // 部分一致
    if (
      normalizedProduct.includes(normalizedSearch) ||
      normalizedSearch.includes(normalizedProduct)
    ) {
      return 0.8;
    }

    // 単語レベルでの一致度を計算
    const searchWords = normalizedSearch.split(/\s+/);
    const productWords = normalizedProduct.split(/\s+/);

    let matchingWords = 0;
    for (const searchWord of searchWords) {
      if (
        productWords.some(
          (productWord) =>
            productWord.includes(searchWord) || searchWord.includes(productWord)
        )
      ) {
        matchingWords++;
      }
    }

    return searchWords.length > 0
      ? (matchingWords / searchWords.length) * 0.6
      : 0;
  }

  /**
   * テキストマッチングスコアを計算します
   * @param searchText 検索テキスト
   * @param targetText 対象テキスト
   * @returns マッチングスコア（0.0 - 1.0）
   */
  private calculateTextMatchScore(
    searchText: string,
    targetText: string
  ): number {
    const normalizedSearch = this.normalizeText(searchText);
    const normalizedTarget = this.normalizeText(targetText);

    if (normalizedTarget.includes(normalizedSearch)) {
      return 0.7;
    }

    // 単語レベルでの一致度を計算
    const searchWords = normalizedSearch.split(/\s+/);
    const targetWords = normalizedTarget.split(/\s+/);

    let matchingWords = 0;
    for (const searchWord of searchWords) {
      if (targetWords.some((targetWord) => targetWord.includes(searchWord))) {
        matchingWords++;
      }
    }

    return searchWords.length > 0
      ? (matchingWords / searchWords.length) * 0.5
      : 0;
  }

  /**
   * 特徴マッチングスコアを計算します
   * @param searchFeatures 検索対象の特徴配列
   * @param productFeatures 商品の特徴文字列
   * @returns マッチングスコア（0.0 - 1.0）
   */
  private calculateFeaturesMatchScore(
    searchFeatures: string[],
    productFeatures: string
  ): number {
    const normalizedProductFeatures = this.normalizeText(productFeatures);

    let matchingFeatures = 0;
    for (const feature of searchFeatures) {
      const normalizedFeature = this.normalizeText(feature);
      if (normalizedProductFeatures.includes(normalizedFeature)) {
        matchingFeatures++;
      }
    }

    return searchFeatures.length > 0
      ? matchingFeatures / searchFeatures.length
      : 0;
  }

  /**
   * 価格マッチングスコアを計算します
   * @param priceRange 価格範囲
   * @param productPrice 商品価格
   * @returns マッチングスコア（0.0 - 1.0）
   */
  private calculatePriceMatchScore(
    priceRange: { min: number; max: number },
    productPrice: number
  ): number {
    // 価格が範囲内にある場合
    if (productPrice >= priceRange.min && productPrice <= priceRange.max) {
      return 1.0;
    }

    // 価格が範囲外の場合、どの程度近いかを計算
    const rangeSize = priceRange.max - priceRange.min;
    const distance = Math.min(
      Math.abs(productPrice - priceRange.min),
      Math.abs(productPrice - priceRange.max)
    );

    // 範囲の50%以内なら部分的にマッチ
    if (distance <= rangeSize * 0.5) {
      return 1.0 - (distance / (rangeSize * 0.5)) * 0.5;
    }

    return 0;
  }

  /**
   * マッチング理由を生成します
   * @param searchName 検索対象の商品名
   * @param searchFeatures 検索対象の特徴配列
   * @param product 商品情報
   * @param priceRange 価格範囲（オプション）
   * @returns マッチング理由の配列
   */
  private generateMatchReasons(
    searchName: string,
    searchFeatures: string[],
    product: ProductSearchResult,
    priceRange?: { min: number; max: number }
  ): string[] {
    const reasons: string[] = [];

    // 商品名マッチング理由
    const nameScore = this.calculateNameMatchScore(searchName, product.name);
    if (nameScore >= 0.8) {
      reasons.push("商品名が高い類似性を示しています");
    } else if (nameScore >= 0.5) {
      reasons.push("商品名に部分的な一致があります");
    }

    // 特徴マッチング理由
    if (searchFeatures.length > 0) {
      const featuresScore = this.calculateFeaturesMatchScore(
        searchFeatures,
        product.features
      );
      if (featuresScore >= 0.7) {
        reasons.push("商品特徴が高い一致率を示しています");
      } else if (featuresScore >= 0.4) {
        reasons.push("商品特徴に部分的な一致があります");
      }
    }

    // 価格マッチング理由
    if (priceRange && product.price) {
      const priceScore = this.calculatePriceMatchScore(
        priceRange,
        Number(product.price)
      );
      if (priceScore >= 0.8) {
        reasons.push("価格が希望範囲内にあります");
      } else if (priceScore >= 0.5) {
        reasons.push("価格が希望範囲に近いです");
      }
    }

    // 評価・レビュー情報
    if (product.rating && Number(product.rating) >= 4.0) {
      reasons.push("高評価の商品です");
    }

    if (product.review_count && Number(product.review_count) >= 100) {
      reasons.push("多くのレビューがある人気商品です");
    }

    return reasons.length > 0 ? reasons : ["基本的な条件に一致しています"];
  }

  /**
   * テキストを正規化します（小文字化、空白の統一など）
   * @param text 正規化対象のテキスト
   * @returns 正規化されたテキスト
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[　\s]+/g, " ") // 全角・半角スペースを統一
      .replace(/[！!]/g, "!")
      .replace(/[？?]/g, "?")
      .trim();
  }

  /**
   * フォールバック処理：信頼度が閾値以下の場合の代替マッチング
   * @param aiRecommendation AI が生成したレコメンドアイテム
   * @param categoryId 対象カテゴリID
   * @returns フォールバック処理で見つかった商品マッチまたは null
   */
  async performFallbackMatching(
    aiRecommendation: AIRecommendationItem,
    categoryId: string
  ): Promise<ProductMatch | null> {
    try {
      console.log(`フォールバック処理を開始: ${aiRecommendation.productName}`);

      // 1. より緩い条件での検索
      const relaxedMatches = await this.findProductsWithRelaxedCriteria(
        aiRecommendation,
        categoryId
      );

      if (relaxedMatches.length > 0) {
        const bestMatch = relaxedMatches[0];
        console.log(
          `緩い条件でマッチを発見: ${bestMatch.productId}, 信頼度: ${bestMatch.confidence}`
        );
        return bestMatch;
      }

      // 2. カテゴリ内の人気商品を提案
      const popularProduct = await this.findPopularProductInCategory(
        categoryId
      );
      if (popularProduct) {
        console.log(`人気商品を代替として提案: ${popularProduct.productId}`);
        return popularProduct;
      }

      // 3. 価格範囲のみでの検索
      if (aiRecommendation.priceRange) {
        const priceBasedMatch = await this.findProductsByPriceRange(
          aiRecommendation.priceRange,
          categoryId
        );
        if (priceBasedMatch) {
          console.log(
            `価格範囲ベースでマッチを発見: ${priceBasedMatch.productId}`
          );
          return priceBasedMatch;
        }
      }

      console.log("フォールバック処理でもマッチが見つかりませんでした");
      return null;
    } catch (error) {
      console.error("フォールバック処理中にエラーが発生しました:", error);
      return null;
    }
  }

  /**
   * より緩い条件での商品検索
   * @param aiRecommendation AI レコメンドアイテム
   * @param categoryId カテゴリID
   * @returns マッチした商品の配列
   */
  private async findProductsWithRelaxedCriteria(
    aiRecommendation: AIRecommendationItem,
    categoryId: string
  ): Promise<ProductMatch[]> {
    // 商品名の単語を分割して部分検索
    const nameWords = this.normalizeText(aiRecommendation.productName)
      .split(/\s+/)
      .filter((word) => word.length > 2); // 2文字以下の単語は除外

    if (nameWords.length === 0) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        productCategories: {
          some: {
            categoryId: categoryId,
          },
        },
        availability: 1,
        OR: nameWords.map((word) => ({
          OR: [
            { name: { contains: word, mode: "insensitive" } },
            { description: { contains: word, mode: "insensitive" } },
            { features: { contains: word, mode: "insensitive" } },
          ],
        })),
      },
      select: {
        id: true,
        name: true,
        description: true,
        features: true,
        price: true,
        rating: true,
        review_count: true,
      },
      take: 50,
    });

    const matches: ProductMatch[] = [];
    for (const product of products) {
      // 緩い条件での信頼度計算（閾値を下げる）
      const confidence = this.calculateRelaxedConfidenceScore(
        aiRecommendation,
        product
      );

      if (confidence > 0.3) {
        // 通常より低い閾値
        matches.push({
          productId: product.id,
          confidence,
          matchReasons: [
            "緩い条件でのマッチング",
            ...this.generateMatchReasons(
              aiRecommendation.productName,
              aiRecommendation.features,
              product,
              aiRecommendation.priceRange
            ),
          ],
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * カテゴリ内の人気商品を検索
   * @param categoryId カテゴリID
   * @returns 人気商品のマッチ情報または null
   */
  private async findPopularProductInCategory(
    categoryId: string
  ): Promise<ProductMatch | null> {
    const popularProduct = await prisma.product.findFirst({
      where: {
        productCategories: {
          some: {
            categoryId: categoryId,
          },
        },
        availability: 1,
        rating: {
          gte: 4.0,
        },
        review_count: {
          gte: 50,
        },
      },
      orderBy: [{ rating: "desc" }, { review_count: "desc" }],
      select: {
        id: true,
        name: true,
        rating: true,
        review_count: true,
      },
    });

    if (!popularProduct) {
      return null;
    }

    return {
      productId: popularProduct.id,
      confidence: 0.5, // フォールバック処理での固定信頼度
      matchReasons: [
        "カテゴリ内の人気商品として提案",
        `評価: ${popularProduct.rating}/5.0`,
        `レビュー数: ${popularProduct.review_count}件`,
      ],
    };
  }

  /**
   * 価格範囲のみでの商品検索
   * @param priceRange 価格範囲
   * @param categoryId カテゴリID
   * @returns 価格範囲マッチの商品情報または null
   */
  private async findProductsByPriceRange(
    priceRange: { min: number; max: number },
    categoryId: string
  ): Promise<ProductMatch | null> {
    const product = await prisma.product.findFirst({
      where: {
        productCategories: {
          some: {
            categoryId: categoryId,
          },
        },
        availability: 1,
        price: {
          gte: priceRange.min,
          lte: priceRange.max,
        },
      },
      orderBy: [{ rating: "desc" }, { review_count: "desc" }],
      select: {
        id: true,
        name: true,
        price: true,
        rating: true,
      },
    });

    if (!product) {
      return null;
    }

    return {
      productId: product.id,
      confidence: 0.4, // 価格のみマッチでの固定信頼度
      matchReasons: [
        "価格範囲での条件マッチ",
        `価格: ¥${Number(product.price).toLocaleString()}`,
        product.rating ? `評価: ${product.rating}/5.0` : "",
      ].filter(Boolean),
    };
  }

  /**
   * 緩い条件での信頼度スコア計算
   * @param aiRecommendation AI レコメンドアイテム
   * @param product 商品情報
   * @returns 緩い条件での信頼度スコア
   */
  private calculateRelaxedConfidenceScore(
    aiRecommendation: AIRecommendationItem,
    product: ProductSearchResult
  ): number {
    let score = 0;
    let factors = 0;

    // 商品名の部分一致（重み軽減）
    const nameScore = this.calculateNameMatchScore(
      aiRecommendation.productName,
      product.name
    );
    if (nameScore > 0) {
      score += nameScore * 0.6; // 通常より低い重み
      factors++;
    }

    // 特徴の部分一致
    if (aiRecommendation.features.length > 0) {
      const featuresScore = this.calculateFeaturesMatchScore(
        aiRecommendation.features,
        product.features
      );
      if (featuresScore > 0) {
        score += featuresScore * 0.5;
        factors++;
      }
    }

    // 価格範囲
    if (aiRecommendation.priceRange && product.price) {
      const priceScore = this.calculatePriceMatchScore(
        aiRecommendation.priceRange,
        Number(product.price)
      );
      if (priceScore > 0) {
        score += priceScore * 0.4;
        factors++;
      }
    }

    // 評価ボーナス
    if (product.rating && Number(product.rating) >= 4.0) {
      score += 0.2;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * 信頼度評価とフォールバック処理を含む包括的なマッピング
   * @param aiRecommendation AI が生成したレコメンドアイテム
   * @param categoryId 対象カテゴリID
   * @returns マッチした商品情報（フォールバック処理含む）
   */
  async mapWithConfidenceEvaluation(
    aiRecommendation: AIRecommendationItem,
    categoryId: string
  ): Promise<ProductMatch | null> {
    try {
      // 通常のマッピングを試行
      const primaryMatch = await this.mapAIRecommendationToProduct(
        aiRecommendation,
        categoryId
      );

      if (
        primaryMatch &&
        primaryMatch.confidence >= AI_RECOMMENDATION_CONFIG.mappingThreshold
      ) {
        console.log(
          `通常マッピング成功: ${primaryMatch.productId}, 信頼度: ${primaryMatch.confidence}`
        );
        return primaryMatch;
      }

      console.log(
        `通常マッピングの信頼度が閾値以下: ${primaryMatch?.confidence || 0} < ${
          AI_RECOMMENDATION_CONFIG.mappingThreshold
        }`
      );

      // フォールバック処理を実行
      const fallbackMatch = await this.performFallbackMatching(
        aiRecommendation,
        categoryId
      );

      if (fallbackMatch) {
        // フォールバック処理であることを理由に追加
        fallbackMatch.matchReasons.unshift(
          "フォールバック処理による代替マッチング"
        );
        return fallbackMatch;
      }

      console.log("フォールバック処理でもマッチが見つかりませんでした");
      return null;
    } catch (error) {
      console.error("信頼度評価付きマッピング中にエラーが発生しました:", error);
      throw error;
    }
  }

  /**
   * マッチング統計情報を取得
   * @param matches マッチ結果の配列
   * @returns 統計情報
   */
  getMatchingStatistics(matches: (ProductMatch | null)[]): {
    totalAttempts: number;
    successfulMatches: number;
    highConfidenceMatches: number;
    fallbackMatches: number;
    successRate: number;
  } {
    const totalAttempts = matches.length;
    const successfulMatches = matches.filter((match) => match !== null).length;
    const highConfidenceMatches = matches.filter(
      (match) =>
        match && match.confidence >= AI_RECOMMENDATION_CONFIG.mappingThreshold
    ).length;
    const fallbackMatches = matches.filter(
      (match) =>
        match &&
        match.matchReasons.some(
          (reason) =>
            reason.includes("フォールバック") || reason.includes("代替")
        )
    ).length;

    return {
      totalAttempts,
      successfulMatches,
      highConfidenceMatches,
      fallbackMatches,
      successRate: totalAttempts > 0 ? successfulMatches / totalAttempts : 0,
    };
  }
}

/**
 * Product Mapper Service のシングルトンインスタンス
 */
export const productMapperService = new ProductMapperServiceImpl();
