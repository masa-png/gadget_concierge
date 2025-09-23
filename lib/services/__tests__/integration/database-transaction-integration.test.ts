/**
 * データベーストランザクション統合テスト
 *
 * レコメンド生成プロセスでのデータベーストランザクションの整合性をテストします。
 * 要件 4.2, 7.1, 7.2 のデータベース操作整合性を検証します。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { RecommendationData } from "@/lib/types/ai-recommendations";

// Prisma のモック
const mockPrisma = {
  questionnaireSession: {
    findUnique: vi.fn(),
  },
  recommendation: {
    count: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
  userProfile: {
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("データベーストランザクション統合テスト", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("トランザクション成功シナリオ", () => {
    it("レコメンド保存が原子的に実行される", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "transaction-test-session";
      const recommendationData: RecommendationData[] = [
        {
          sessionId,
          productId: "product1",
          rank: 1,
          score: 90,
          reason: "最高評価の商品です",
        },
        {
          sessionId,
          productId: "product2",
          rank: 2,
          score: 85,
          reason: "コストパフォーマンスが優秀です",
        },
      ];

      // 初期チェック用のモック
      mockPrisma.recommendation.count.mockResolvedValue(0); // 既存レコメンドなし
      mockPrisma.questionnaireSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "COMPLETED",
      });
      mockPrisma.product.findMany.mockResolvedValue([
        { id: "product1" },
        { id: "product2" },
      ]);

      // トランザクション成功のモック
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          ...mockPrisma,
          recommendation: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
          questionnaireSession: {
            findUnique: vi.fn().mockResolvedValue({
              id: sessionId,
              userProfileId: "user-profile-123",
            }),
          },
          userProfile: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return await callback(mockTx);
      });

      // レコメンド保存の実行
      await service.saveRecommendations(recommendationData);

      // トランザクションが呼び出されたことを確認
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("複数のデータベース操作が単一トランザクションで実行される", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "multi-operation-session";
      const recommendationData: RecommendationData[] = [
        {
          sessionId,
          productId: "product1",
          rank: 1,
          score: 95,
          reason: "優秀な商品",
        },
      ];

      const transactionOperations: string[] = [];

      // 初期チェック用のモック
      mockPrisma.recommendation.count.mockResolvedValue(0);
      mockPrisma.questionnaireSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "COMPLETED",
      });
      mockPrisma.product.findMany.mockResolvedValue([{ id: "product1" }]);

      // トランザクション内の操作を追跡
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          recommendation: {
            createMany: vi.fn().mockImplementation(() => {
              transactionOperations.push("createMany");
              return Promise.resolve({ count: 1 });
            }),
          },
          questionnaireSession: {
            findUnique: vi.fn().mockImplementation(() => {
              transactionOperations.push("findUnique");
              return Promise.resolve({
                id: sessionId,
                userProfileId: "user-profile-123",
              });
            }),
          },
          userProfile: {
            update: vi.fn().mockImplementation(() => {
              transactionOperations.push("userProfileUpdate");
              return Promise.resolve({});
            }),
          },
        };
        return await callback(mockTx);
      });

      await service.saveRecommendations(recommendationData);

      // トランザクション内で複数の操作が実行されたことを確認
      expect(transactionOperations).toContain("createMany");
      expect(transactionOperations).toContain("findUnique");
      expect(transactionOperations).toContain("userProfileUpdate");
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("トランザクション失敗シナリオ", () => {
    it("データベースエラー時にトランザクションがロールバックされる", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "rollback-test-session";
      const recommendationData: RecommendationData[] = [
        {
          sessionId,
          productId: "product1",
          rank: 1,
          score: 90,
          reason: "テスト商品",
        },
      ];

      // 初期チェック用のモック
      mockPrisma.recommendation.count.mockResolvedValue(0);
      mockPrisma.questionnaireSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "COMPLETED",
      });
      mockPrisma.product.findMany.mockResolvedValue([{ id: "product1" }]);

      // トランザクション内でエラーが発生するシナリオ
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          recommendation: {
            createMany: vi
              .fn()
              .mockRejectedValue(new Error("Database constraint violation")),
          },
          questionnaireSession: {
            findUnique: vi.fn().mockResolvedValue({
              id: sessionId,
              userProfileId: "user-profile-123",
            }),
          },
          userProfile: {
            update: vi.fn(),
          },
        };

        try {
          return await callback(mockTx);
        } catch {
          // トランザクションエラーをシミュレート
          throw new Error("Transaction failed");
        }
      });

      // エラーが適切に処理されることを確認
      await expect(
        service.saveRecommendations(recommendationData)
      ).rejects.toThrow();

      // トランザクションが呼び出されたことを確認
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("重複レコメンドの検出が正しく動作する", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "duplicate-test-session";

      // 既存のレコメンドをシミュレート
      mockPrisma.recommendation.count.mockResolvedValue(1); // 既存レコメンドあり
      mockPrisma.questionnaireSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "COMPLETED",
      });

      const newRecommendationData: RecommendationData[] = [
        {
          sessionId,
          productId: "product2",
          rank: 1,
          score: 85,
          reason: "新しいレコメンド",
        },
      ];

      // 重複チェックでエラーが発生することを確認
      await expect(
        service.saveRecommendations(newRecommendationData)
      ).rejects.toThrow("このセッションのレコメンドは既に生成されています");

      // トランザクションが呼び出されないことを確認（重複チェックで早期終了）
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("データ整合性テスト", () => {
    it("外部キー制約が正しく検証される", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "foreign-key-test-session";
      const recommendationData: RecommendationData[] = [
        {
          sessionId: "non-existent-session", // 存在しないセッションID
          productId: "product1",
          rank: 1,
          score: 90,
          reason: "外部キーテスト",
        },
      ];

      // 存在しないセッションをシミュレート
      mockPrisma.recommendation.count.mockResolvedValue(0);
      mockPrisma.questionnaireSession.findUnique.mockResolvedValue(null); // セッションが存在しない

      // 外部キー制約エラーが適切に処理されることを確認
      await expect(
        service.saveRecommendations(recommendationData)
      ).rejects.toThrow();
    });

    it("商品の存在確認が正しく動作する", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "product-validation-test-session";
      const recommendationData: RecommendationData[] = [
        {
          sessionId,
          productId: "non-existent-product", // 存在しない商品ID
          rank: 1,
          score: 90,
          reason: "商品存在確認テスト",
        },
      ];

      // 初期チェック用のモック
      mockPrisma.recommendation.count.mockResolvedValue(0);
      mockPrisma.questionnaireSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "COMPLETED",
      });
      mockPrisma.product.findMany.mockResolvedValue([]); // 商品が存在しない

      // 商品存在確認エラーが適切に処理されることを確認
      await expect(
        service.saveRecommendations(recommendationData)
      ).rejects.toThrow("Productが見つかりません");
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量データの一括挿入が効率的に実行される", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "bulk-insert-test-session";

      // 大量のレコメンドデータを生成
      const recommendationData: RecommendationData[] = Array.from(
        { length: 50 },
        (_, index) => ({
          sessionId,
          productId: `product${index + 1}`,
          rank: index + 1,
          score: 90 - index,
          reason: `商品${index + 1}の理由`,
        })
      );

      let transactionStartTime: number;
      let transactionEndTime: number;

      // 初期チェック用のモック
      mockPrisma.recommendation.count.mockResolvedValue(0);
      mockPrisma.questionnaireSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "COMPLETED",
      });
      mockPrisma.product.findMany.mockResolvedValue(
        Array.from({ length: 50 }, (_, index) => ({
          id: `product${index + 1}`,
        }))
      );

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        transactionStartTime = Date.now();

        const mockTx = {
          recommendation: {
            createMany: vi.fn().mockResolvedValue({ count: 50 }),
          },
          questionnaireSession: {
            findUnique: vi.fn().mockResolvedValue({
              id: sessionId,
              userProfileId: "user-profile-123",
            }),
          },
          userProfile: {
            update: vi.fn().mockResolvedValue({}),
          },
        };

        const result = await callback(mockTx);
        transactionEndTime = Date.now();
        return result;
      });

      await service.saveRecommendations(recommendationData);

      // パフォーマンス検証
      const transactionDuration = transactionEndTime! - transactionStartTime!;
      expect(transactionDuration).toBeLessThan(5000); // 5秒以内

      // トランザクションが1回だけ呼び出されることを確認
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("トランザクションタイムアウトが適切に処理される", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "timeout-test-session";
      const recommendationData: RecommendationData[] = [
        {
          sessionId,
          productId: "product1",
          rank: 1,
          score: 90,
          reason: "タイムアウトテスト",
        },
      ];

      // 初期チェック用のモック
      mockPrisma.recommendation.count.mockResolvedValue(0);
      mockPrisma.questionnaireSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "COMPLETED",
      });
      mockPrisma.product.findMany.mockResolvedValue([{ id: "product1" }]);

      // タイムアウトをシミュレート
      mockPrisma.$transaction.mockImplementation(async () => {
        // 長時間の処理をシミュレート
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error("Transaction timeout");
      });

      // タイムアウトエラーが適切に処理されることを確認
      await expect(
        service.saveRecommendations(recommendationData)
      ).rejects.toThrow();
    });
  });

  describe("同時実行制御テスト", () => {
    it("同じセッションに対する同時レコメンド生成が適切に制御される", async () => {
      const { RecommendationSaverService } = await import(
        "@/lib/services/recommendation-saver"
      );
      const service = new RecommendationSaverService();

      const sessionId = "concurrent-test-session";
      const recommendationData1: RecommendationData[] = [
        {
          sessionId,
          productId: "product1",
          rank: 1,
          score: 90,
          reason: "最初のリクエスト",
        },
      ];

      const recommendationData2: RecommendationData[] = [
        {
          sessionId,
          productId: "product2",
          rank: 1,
          score: 85,
          reason: "2番目のリクエスト",
        },
      ];

      let firstRequestCompleted = false;

      // 最初のリクエストのモック
      mockPrisma.recommendation.count
        .mockResolvedValueOnce(0) // 最初のリクエスト：既存レコメンドなし
        .mockResolvedValueOnce(1); // 2番目のリクエスト：既存レコメンドあり

      mockPrisma.questionnaireSession.findUnique.mockResolvedValue({
        id: sessionId,
        status: "COMPLETED",
      });

      mockPrisma.product.findMany
        .mockResolvedValueOnce([{ id: "product1" }])
        .mockResolvedValueOnce([{ id: "product2" }]);

      mockPrisma.$transaction.mockImplementationOnce(async (callback) => {
        const mockTx = {
          recommendation: {
            createMany: vi.fn().mockImplementation(async () => {
              await new Promise((resolve) => setTimeout(resolve, 50)); // 処理時間をシミュレート
              firstRequestCompleted = true;
              return { count: 1 };
            }),
          },
          questionnaireSession: {
            findUnique: vi.fn().mockResolvedValue({
              id: sessionId,
              userProfileId: "user-profile-123",
            }),
          },
          userProfile: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return await callback(mockTx);
      });

      // 同時実行をシミュレート
      const [result1, result2] = await Promise.allSettled([
        service.saveRecommendations(recommendationData1),
        service.saveRecommendations(recommendationData2),
      ]);

      // 最初のリクエストは成功
      expect(result1.status).toBe("fulfilled");
      expect(firstRequestCompleted).toBe(true);

      // 2番目のリクエストは重複エラーで失敗
      expect(result2.status).toBe("rejected");
      if (result2.status === "rejected") {
        expect(result2.reason.message).toContain(
          "このセッションのレコメンドは既に生成されています"
        );
      }
    });
  });
});
