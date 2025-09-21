/**
 * レコメンド保存サービスのテスト
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RecommendationSaverService } from "../recommendation-saver";
import { prisma } from "@/lib/prisma";
import { RecommendationData } from "@/lib/types/ai-recommendations";
import {
  AIRecommendationError,
  AIRecommendationErrorCode,
} from "@/lib/errors/ai-recommendation-error";

// Prisma のモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    recommendation: {
      count: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    questionnaireSession: {
      findUnique: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    userProfile: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("RecommendationSaverService", () => {
  let service: RecommendationSaverService;
  const mockSessionId = "test-session-id";
  const mockRecommendations: RecommendationData[] = [
    {
      sessionId: mockSessionId,
      productId: "product-1",
      rank: 1,
      score: 95.5,
      reason: "最適な商品です",
    },
    {
      sessionId: mockSessionId,
      productId: "product-2",
      rank: 2,
      score: 88.2,
      reason: "良い選択肢です",
    },
  ];

  beforeEach(() => {
    service = new RecommendationSaverService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("checkExistingRecommendations", () => {
    it("既存レコメンドが存在する場合は true を返す", async () => {
      // Arrange
      (prisma.recommendation.count as any).mockResolvedValue(3);

      // Act
      const result = await service.checkExistingRecommendations(mockSessionId);

      // Assert
      expect(result).toBe(true);
      expect(prisma.recommendation.count).toHaveBeenCalledWith({
        where: { questionnaireSessionId: mockSessionId },
      });
    });

    it("既存レコメンドが存在しない場合は false を返す", async () => {
      // Arrange
      (prisma.recommendation.count as any).mockResolvedValue(0);

      // Act
      const result = await service.checkExistingRecommendations(mockSessionId);

      // Assert
      expect(result).toBe(false);
    });

    it("データベースエラーが発生した場合は適切なエラーを投げる", async () => {
      // Arrange
      const dbError = new Error("Database connection failed");
      (prisma.recommendation.count as any).mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.checkExistingRecommendations(mockSessionId)
      ).rejects.toThrow(AIRecommendationError);
    });
  });

  describe("saveRecommendations", () => {
    beforeEach(() => {
      // デフォルトのモック設定
      (prisma.recommendation.count as any).mockResolvedValue(0);
      (prisma.questionnaireSession.findUnique as any).mockResolvedValue({
        id: mockSessionId,
        status: "COMPLETED",
        userProfileId: "user-profile-1",
      });
      (prisma.product.findMany as any).mockResolvedValue([
        { id: "product-1" },
        { id: "product-2" },
      ]);
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          recommendation: { createMany: vi.fn() },
          questionnaireSession: {
            findUnique: vi.fn().mockResolvedValue({
              userProfileId: "user-profile-1",
            }),
          },
          userProfile: { update: vi.fn() },
        };
        return callback(mockTx);
      });
    });

    it("正常なレコメンドデータを保存できる", async () => {
      // Act
      await service.saveRecommendations(mockRecommendations);

      // Assert
      expect(prisma.recommendation.count).toHaveBeenCalledWith({
        where: { questionnaireSessionId: mockSessionId },
      });
      expect(prisma.questionnaireSession.findUnique).toHaveBeenCalledWith({
        where: { id: mockSessionId },
        select: { id: true, status: true },
      });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ["product-1", "product-2"] } },
        select: { id: true },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("空のレコメンドデータの場合はエラーを投げる", async () => {
      // Act & Assert
      await expect(service.saveRecommendations([])).rejects.toThrow(
        AIRecommendationError
      );
    });

    it("複数の異なるセッションIDが含まれる場合はエラーを投げる", async () => {
      // Arrange
      const invalidRecommendations = [
        { ...mockRecommendations[0], sessionId: "session-1" },
        { ...mockRecommendations[1], sessionId: "session-2" },
      ];

      // Act & Assert
      await expect(
        service.saveRecommendations(invalidRecommendations)
      ).rejects.toThrow(AIRecommendationError);
    });

    it("既存レコメンドがある場合は重複エラーを投げる", async () => {
      // Arrange
      (prisma.recommendation.count as any).mockResolvedValue(1);

      // Act & Assert
      await expect(
        service.saveRecommendations(mockRecommendations)
      ).rejects.toThrow(AIRecommendationError);

      const error = await service
        .saveRecommendations(mockRecommendations)
        .catch((e) => e);
      expect(error.code).toBe(
        AIRecommendationErrorCode.DUPLICATE_RECOMMENDATION
      );
    });

    it("セッションが存在しない場合はエラーを投げる", async () => {
      // Arrange
      (prisma.questionnaireSession.findUnique as any).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.saveRecommendations(mockRecommendations)
      ).rejects.toThrow(AIRecommendationError);
    });

    it("セッションが完了していない場合はエラーを投げる", async () => {
      // Arrange
      (prisma.questionnaireSession.findUnique as any).mockResolvedValue({
        id: mockSessionId,
        status: "IN_PROGRESS",
      });

      // Act & Assert
      await expect(
        service.saveRecommendations(mockRecommendations)
      ).rejects.toThrow(AIRecommendationError);
    });

    it("商品が存在しない場合はエラーを投げる", async () => {
      // Arrange
      (prisma.product.findMany as any).mockResolvedValue([{ id: "product-1" }]); // product-2 が存在しない

      // Act & Assert
      await expect(
        service.saveRecommendations(mockRecommendations)
      ).rejects.toThrow(AIRecommendationError);
    });

    it("ランクに重複がある場合はエラーを投げる", async () => {
      // Arrange
      const duplicateRankRecommendations = [
        { ...mockRecommendations[0], rank: 1 },
        { ...mockRecommendations[1], rank: 1 }, // 重複
      ];

      // Act & Assert
      await expect(
        service.saveRecommendations(duplicateRankRecommendations)
      ).rejects.toThrow(AIRecommendationError);
    });

    it("トランザクションが失敗した場合は適切なエラーを投げる", async () => {
      // Arrange
      const transactionError = new Error("Transaction failed");
      (prisma.$transaction as any).mockRejectedValue(transactionError);

      // Act & Assert
      await expect(
        service.saveRecommendations(mockRecommendations)
      ).rejects.toThrow(AIRecommendationError);

      const error = await service
        .saveRecommendations(mockRecommendations)
        .catch((e) => e);
      expect(error.code).toBe(
        AIRecommendationErrorCode.DATABASE_TRANSACTION_FAILED
      );
    });

    it("トランザクション内でセッションが見つからない場合はロールバックする", async () => {
      // Arrange
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          recommendation: { createMany: vi.fn() },
          questionnaireSession: {
            findUnique: vi.fn().mockResolvedValue(null), // セッションが見つからない
          },
          userProfile: { update: vi.fn() },
        };
        return callback(mockTx);
      });

      // Act & Assert
      await expect(
        service.saveRecommendations(mockRecommendations)
      ).rejects.toThrow(AIRecommendationError);

      const error = await service
        .saveRecommendations(mockRecommendations)
        .catch((e) => e);
      expect(error.code).toBe(
        AIRecommendationErrorCode.DATABASE_TRANSACTION_FAILED
      );
    });
  });

  describe("getRecommendationCount", () => {
    it("レコメンド数を正しく取得できる", async () => {
      // Arrange
      (prisma.recommendation.count as any).mockResolvedValue(5);

      // Act
      const count = await service.getRecommendationCount(mockSessionId);

      // Assert
      expect(count).toBe(5);
      expect(prisma.recommendation.count).toHaveBeenCalledWith({
        where: { questionnaireSessionId: mockSessionId },
      });
    });
  });

  describe("deleteRecommendations", () => {
    it("レコメンドを正しく削除できる", async () => {
      // Arrange
      (prisma.recommendation.deleteMany as any).mockResolvedValue({ count: 3 });

      // Act
      await service.deleteRecommendations(mockSessionId);

      // Assert
      expect(prisma.recommendation.deleteMany).toHaveBeenCalledWith({
        where: { questionnaireSessionId: mockSessionId },
      });
    });
  });

  describe("deleteRecommendationsWithTransaction", () => {
    beforeEach(() => {
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          recommendation: {
            count: vi.fn().mockResolvedValue(3),
            deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
          },
          questionnaireSession: {
            findUnique: vi.fn().mockResolvedValue({
              userProfileId: "user-profile-1",
            }),
          },
          userProfile: { update: vi.fn() },
        };
        return callback(mockTx);
      });
    });

    it("トランザクション付きでレコメンドを削除できる", async () => {
      // Act
      await service.deleteRecommendationsWithTransaction(mockSessionId, true);

      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("削除対象が存在しない場合は何もしない", async () => {
      // Arrange
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          recommendation: {
            count: vi.fn().mockResolvedValue(0), // 削除対象なし
            deleteMany: vi.fn(),
          },
          questionnaireSession: { findUnique: vi.fn() },
          userProfile: { update: vi.fn() },
        };
        return callback(mockTx);
      });

      // Act
      await service.deleteRecommendationsWithTransaction(mockSessionId, true);

      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("削除トランザクションが失敗した場合は適切なエラーを投げる", async () => {
      // Arrange
      const transactionError = new Error("Delete transaction failed");
      (prisma.$transaction as any).mockRejectedValue(transactionError);

      // Act & Assert
      await expect(
        service.deleteRecommendationsWithTransaction(mockSessionId, true)
      ).rejects.toThrow(AIRecommendationError);
    });
  });

  describe("updateRecommendationsWithTransaction", () => {
    const mockUpdates = [
      {
        productId: "product-1",
        rank: 2,
        score: 90.0,
        reason: "更新された理由",
      },
      {
        productId: "product-2",
        score: 85.0,
      },
    ];

    beforeEach(() => {
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          recommendation: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(mockTx);
      });
    });

    it("トランザクション付きでレコメンドを更新できる", async () => {
      // Act
      await service.updateRecommendationsWithTransaction(
        mockSessionId,
        mockUpdates
      );

      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("更新データが空の場合はスキップする", async () => {
      // Arrange
      const emptyUpdates = [{ productId: "product-1" }]; // 更新フィールドなし

      // Act
      await service.updateRecommendationsWithTransaction(
        mockSessionId,
        emptyUpdates
      );

      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("更新トランザクションが失敗した場合は適切なエラーを投げる", async () => {
      // Arrange
      const transactionError = new Error("Update transaction failed");
      (prisma.$transaction as any).mockRejectedValue(transactionError);

      // Act & Assert
      await expect(
        service.updateRecommendationsWithTransaction(mockSessionId, mockUpdates)
      ).rejects.toThrow(AIRecommendationError);
    });
  });
});
