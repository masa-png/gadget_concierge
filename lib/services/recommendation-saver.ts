/**
 * レコメンド保存サービス
 *
 * AI が生成したレコメンドデータを Recommendation テーブルに保存し、
 * 重複チェックとトランザクション管理を行います。
 */

import { prisma } from "@/lib/prisma";
import { RecommendationData } from "@/lib/types/ai-recommendations";
import {
  createAIRecommendationError,
  handleAIRecommendationError,
} from "@/lib/errors/ai-recommendation-error";

export class RecommendationSaverService {
  /**
   * 指定されたセッションに既存のレコメンドが存在するかチェック
   * @param sessionId - アンケートセッションID
   * @returns 既存レコメンドが存在する場合は true
   */
  async checkExistingRecommendations(sessionId: string): Promise<boolean> {
    try {
      const existingCount = await prisma.recommendation.count({
        where: {
          questionnaireSessionId: sessionId,
        },
      });

      return existingCount > 0;
    } catch (error) {
      throw handleAIRecommendationError(error, {
        operation: "checkExistingRecommendations",
        sessionId,
      });
    }
  }

  /**
   * レコメンドデータを Recommendation テーブルに保存
   * 重複チェックを行い、既存データがある場合はエラーを投げる
   * @param recommendations - 保存するレコメンドデータの配列
   */
  async saveRecommendations(
    recommendations: RecommendationData[]
  ): Promise<void> {
    if (!recommendations || recommendations.length === 0) {
      throw createAIRecommendationError.invalidRequestData(
        "保存するレコメンドデータが空です",
        { recommendationsCount: 0 }
      );
    }

    // 全てのレコメンドが同じセッションIDを持つことを確認
    const sessionIds = Array.from(
      new Set(recommendations.map((r) => r.sessionId))
    );
    if (sessionIds.length !== 1) {
      throw createAIRecommendationError.invalidRequestData(
        "複数の異なるセッションIDが含まれています",
        { sessionIds, recommendationsCount: recommendations.length }
      );
    }

    const sessionId = sessionIds[0];

    try {
      // 重複チェック
      const hasExisting = await this.checkExistingRecommendations(sessionId);
      if (hasExisting) {
        throw createAIRecommendationError.duplicateRecommendation(sessionId, {
          recommendationsCount: recommendations.length,
        });
      }

      // セッションの存在確認
      const session = await prisma.questionnaireSession.findUnique({
        where: { id: sessionId },
        select: { id: true, status: true },
      });

      if (!session) {
        throw createAIRecommendationError.dataNotFound(
          "QuestionnaireSession",
          sessionId,
          { operation: "saveRecommendations" }
        );
      }

      if (session.status !== "COMPLETED") {
        throw createAIRecommendationError.sessionNotCompleted(
          sessionId,
          session.status,
          { operation: "saveRecommendations" }
        );
      }

      // 商品の存在確認
      const productIds = recommendations.map((r) => r.productId);
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });

      const existingProductIds = new Set(existingProducts.map((p) => p.id));
      const missingProductIds = productIds.filter(
        (id) => !existingProductIds.has(id)
      );

      if (missingProductIds.length > 0) {
        throw createAIRecommendationError.dataNotFound(
          "Product",
          missingProductIds.join(", "),
          {
            operation: "saveRecommendations",
            missingProductIds,
            totalProducts: productIds.length,
          }
        );
      }

      // ランクの重複チェック
      const ranks = recommendations.map((r) => r.rank);
      const uniqueRanks = new Set(ranks);
      if (ranks.length !== uniqueRanks.size) {
        throw createAIRecommendationError.invalidRequestData(
          "ランクに重複があります",
          {
            ranks,
            duplicateRanks: ranks.filter(
              (rank, index) => ranks.indexOf(rank) !== index
            ),
          }
        );
      }

      // データ保存（単一のトランザクションで実行）
      await this.saveRecommendationsTransaction(recommendations);
    } catch (error) {
      throw handleAIRecommendationError(error, {
        operation: "saveRecommendations",
        sessionId,
        recommendationsCount: recommendations.length,
      });
    }
  }

  /**
   * トランザクション内でレコメンドデータを保存
   * 要件 2.3: 失敗時の部分的変更ロールバック
   * 要件 6.5: 監査目的のトランザクション詳細ログ記録
   * @param recommendations - 保存するレコメンドデータの配列
   * @private
   */
  private async saveRecommendationsTransaction(
    recommendations: RecommendationData[]
  ): Promise<void> {
    const sessionId = recommendations[0].sessionId;
    const transactionStartTime = Date.now();

    // トランザクション開始ログ
    console.log(`[RecommendationSaver] トランザクション開始`, {
      sessionId,
      recommendationsCount: recommendations.length,
      timestamp: new Date().toISOString(),
      operation: "saveRecommendationsTransaction",
    });

    try {
      await prisma.$transaction(
        async (tx) => {
          let recommendationsCreated = false;
          let userProfileUpdated = false;

          try {
            // ステップ 1: レコメンドデータを一括挿入
            const createData = recommendations.map((rec) => ({
              questionnaireSessionId: rec.sessionId,
              productId: rec.productId,
              rank: rec.rank,
              score: rec.score,
              reason: rec.reason,
            }));

            console.log(`[RecommendationSaver] レコメンド挿入開始`, {
              sessionId,
              recordCount: createData.length,
              timestamp: new Date().toISOString(),
            });

            await tx.recommendation.createMany({
              data: createData,
            });

            recommendationsCreated = true;
            console.log(`[RecommendationSaver] レコメンド挿入完了`, {
              sessionId,
              recordCount: createData.length,
              timestamp: new Date().toISOString(),
            });

            // ステップ 2: UserProfile の recommendationCount を更新
            const session = await tx.questionnaireSession.findUnique({
              where: { id: sessionId },
              select: { userProfileId: true },
            });

            if (!session) {
              throw createAIRecommendationError.dataNotFound(
                "QuestionnaireSession",
                sessionId,
                { operation: "saveRecommendationsTransaction" }
              );
            }

            console.log(`[RecommendationSaver] ユーザープロファイル更新開始`, {
              sessionId,
              userProfileId: session.userProfileId,
              incrementBy: recommendations.length,
              timestamp: new Date().toISOString(),
            });

            await tx.userProfile.update({
              where: { id: session.userProfileId },
              data: {
                recommendationCount: {
                  increment: recommendations.length,
                },
              },
            });

            userProfileUpdated = true;
            console.log(`[RecommendationSaver] ユーザープロファイル更新完了`, {
              sessionId,
              userProfileId: session.userProfileId,
              incrementBy: recommendations.length,
              timestamp: new Date().toISOString(),
            });

            // トランザクション成功ログ
            const transactionDuration = Date.now() - transactionStartTime;
            console.log(`[RecommendationSaver] トランザクション成功`, {
              sessionId,
              recommendationsCount: recommendations.length,
              duration: transactionDuration,
              timestamp: new Date().toISOString(),
              operations: {
                recommendationsCreated,
                userProfileUpdated,
              },
            });
          } catch (stepError) {
            // ステップレベルのエラーログ
            console.error(`[RecommendationSaver] トランザクション内エラー`, {
              sessionId,
              error:
                stepError instanceof Error
                  ? stepError.message
                  : String(stepError),
              stack: stepError instanceof Error ? stepError.stack : undefined,
              timestamp: new Date().toISOString(),
              completedOperations: {
                recommendationsCreated,
                userProfileUpdated,
              },
            });

            // エラーを再スローしてトランザクションをロールバック
            throw stepError;
          }
        },
        {
          // トランザクションタイムアウト設定
          timeout: 30000, // 30秒
        }
      );
    } catch (error) {
      const transactionDuration = Date.now() - transactionStartTime;

      // トランザクション失敗ログ（要件 6.5: 監査目的の詳細ログ）
      console.error(
        `[RecommendationSaver] トランザクション失敗 - 自動ロールバック実行`,
        {
          sessionId,
          recommendationsCount: recommendations.length,
          duration: transactionDuration,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          rollbackReason:
            "トランザクション内でエラーが発生したため、すべての変更をロールバックしました",
        }
      );

      // 要件 2.3: 部分的な変更のロールバック（Prismaトランザクションが自動実行）
      throw createAIRecommendationError.databaseTransactionFailed({
        operation: "saveRecommendationsTransaction",
        sessionId,
        recommendationsCount: recommendations.length,
        duration: transactionDuration,
        originalError: error,
        rollbackExecuted: true,
      });
    }
  }

  /**
   * 指定されたセッションのレコメンド数を取得
   * @param sessionId - アンケートセッションID
   * @returns レコメンド数
   */
  async getRecommendationCount(sessionId: string): Promise<number> {
    try {
      return await prisma.recommendation.count({
        where: {
          questionnaireSessionId: sessionId,
        },
      });
    } catch (error) {
      throw handleAIRecommendationError(error, {
        operation: "getRecommendationCount",
        sessionId,
      });
    }
  }

  /**
   * 指定されたセッションのレコメンドを削除（テスト用）
   * @param sessionId - アンケートセッションID
   */
  async deleteRecommendations(sessionId: string): Promise<void> {
    try {
      await prisma.recommendation.deleteMany({
        where: {
          questionnaireSessionId: sessionId,
        },
      });
    } catch (error) {
      throw handleAIRecommendationError(error, {
        operation: "deleteRecommendations",
        sessionId,
      });
    }
  }

  /**
   * トランザクション付きでレコメンドを安全に削除
   * 要件 2.3: 失敗時の部分的変更ロールバック
   * 要件 6.5: 監査目的のトランザクション詳細ログ記録
   * @param sessionId - アンケートセッションID
   * @param updateUserProfile - ユーザープロファイルのカウントも更新するか
   */
  async deleteRecommendationsWithTransaction(
    sessionId: string,
    updateUserProfile: boolean = true
  ): Promise<void> {
    const transactionStartTime = Date.now();

    console.log(`[RecommendationSaver] 削除トランザクション開始`, {
      sessionId,
      updateUserProfile,
      timestamp: new Date().toISOString(),
      operation: "deleteRecommendationsWithTransaction",
    });

    try {
      await prisma.$transaction(
        async (tx) => {
          let recommendationsDeleted = false;
          let userProfileUpdated = false;
          let deletedCount = 0;

          try {
            // ステップ 1: 削除前にカウントを取得
            const existingCount = await tx.recommendation.count({
              where: { questionnaireSessionId: sessionId },
            });

            if (existingCount === 0) {
              console.log(
                `[RecommendationSaver] 削除対象のレコメンドが存在しません`,
                {
                  sessionId,
                  timestamp: new Date().toISOString(),
                }
              );
              return;
            }

            // ステップ 2: レコメンドを削除
            console.log(`[RecommendationSaver] レコメンド削除開始`, {
              sessionId,
              targetCount: existingCount,
              timestamp: new Date().toISOString(),
            });

            const deleteResult = await tx.recommendation.deleteMany({
              where: { questionnaireSessionId: sessionId },
            });

            deletedCount = deleteResult.count;
            recommendationsDeleted = true;

            console.log(`[RecommendationSaver] レコメンド削除完了`, {
              sessionId,
              deletedCount,
              timestamp: new Date().toISOString(),
            });

            // ステップ 3: ユーザープロファイルのカウントを更新
            if (updateUserProfile && deletedCount > 0) {
              const session = await tx.questionnaireSession.findUnique({
                where: { id: sessionId },
                select: { userProfileId: true },
              });

              if (session) {
                console.log(
                  `[RecommendationSaver] ユーザープロファイル削除更新開始`,
                  {
                    sessionId,
                    userProfileId: session.userProfileId,
                    decrementBy: deletedCount,
                    timestamp: new Date().toISOString(),
                  }
                );

                await tx.userProfile.update({
                  where: { id: session.userProfileId },
                  data: {
                    recommendationCount: {
                      decrement: deletedCount,
                    },
                  },
                });

                userProfileUpdated = true;
                console.log(
                  `[RecommendationSaver] ユーザープロファイル削除更新完了`,
                  {
                    sessionId,
                    userProfileId: session.userProfileId,
                    decrementBy: deletedCount,
                    timestamp: new Date().toISOString(),
                  }
                );
              }
            }

            // トランザクション成功ログ
            const transactionDuration = Date.now() - transactionStartTime;
            console.log(`[RecommendationSaver] 削除トランザクション成功`, {
              sessionId,
              deletedCount,
              duration: transactionDuration,
              timestamp: new Date().toISOString(),
              operations: {
                recommendationsDeleted,
                userProfileUpdated,
              },
            });
          } catch (stepError) {
            console.error(
              `[RecommendationSaver] 削除トランザクション内エラー`,
              {
                sessionId,
                error:
                  stepError instanceof Error
                    ? stepError.message
                    : String(stepError),
                stack: stepError instanceof Error ? stepError.stack : undefined,
                timestamp: new Date().toISOString(),
                completedOperations: {
                  recommendationsDeleted,
                  userProfileUpdated,
                },
              }
            );

            throw stepError;
          }
        },
        {
          timeout: 30000,
        }
      );
    } catch (error) {
      const transactionDuration = Date.now() - transactionStartTime;

      console.error(
        `[RecommendationSaver] 削除トランザクション失敗 - 自動ロールバック実行`,
        {
          sessionId,
          duration: transactionDuration,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          rollbackReason:
            "削除トランザクション内でエラーが発生したため、すべての変更をロールバックしました",
        }
      );

      throw handleAIRecommendationError(error, {
        operation: "deleteRecommendationsWithTransaction",
        sessionId,
        duration: transactionDuration,
        rollbackExecuted: true,
      });
    }
  }

  /**
   * レコメンドの部分更新をトランザクション付きで実行
   * 要件 2.3: 失敗時の部分的変更ロールバック
   * 要件 6.5: 監査目的のトランザクション詳細ログ記録
   * @param sessionId - アンケートセッションID
   * @param updates - 更新するレコメンドデータ
   */
  async updateRecommendationsWithTransaction(
    sessionId: string,
    updates: Array<{
      productId: string;
      rank?: number;
      score?: number;
      reason?: string;
    }>
  ): Promise<void> {
    const transactionStartTime = Date.now();

    console.log(`[RecommendationSaver] 更新トランザクション開始`, {
      sessionId,
      updatesCount: updates.length,
      timestamp: new Date().toISOString(),
      operation: "updateRecommendationsWithTransaction",
    });

    try {
      await prisma.$transaction(
        async (tx) => {
          let updatedCount = 0;

          try {
            // 各レコメンドを個別に更新
            for (const update of updates) {
              const updateData: Record<string, unknown> = {};
              if (update.rank !== undefined) updateData.rank = update.rank;
              if (update.score !== undefined) updateData.score = update.score;
              if (update.reason !== undefined)
                updateData.reason = update.reason;

              if (Object.keys(updateData).length === 0) {
                continue; // 更新データがない場合はスキップ
              }

              console.log(`[RecommendationSaver] レコメンド更新実行`, {
                sessionId,
                productId: update.productId,
                updateFields: Object.keys(updateData),
                timestamp: new Date().toISOString(),
              });

              const result = await tx.recommendation.updateMany({
                where: {
                  questionnaireSessionId: sessionId,
                  productId: update.productId,
                },
                data: updateData,
              });

              updatedCount += result.count;
            }

            // トランザクション成功ログ
            const transactionDuration = Date.now() - transactionStartTime;
            console.log(`[RecommendationSaver] 更新トランザクション成功`, {
              sessionId,
              updatedCount,
              duration: transactionDuration,
              timestamp: new Date().toISOString(),
            });
          } catch (stepError) {
            console.error(
              `[RecommendationSaver] 更新トランザクション内エラー`,
              {
                sessionId,
                updatedCount,
                error:
                  stepError instanceof Error
                    ? stepError.message
                    : String(stepError),
                stack: stepError instanceof Error ? stepError.stack : undefined,
                timestamp: new Date().toISOString(),
              }
            );

            throw stepError;
          }
        },
        {
          timeout: 30000,
        }
      );
    } catch (error) {
      const transactionDuration = Date.now() - transactionStartTime;

      console.error(
        `[RecommendationSaver] 更新トランザクション失敗 - 自動ロールバック実行`,
        {
          sessionId,
          duration: transactionDuration,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          rollbackReason:
            "更新トランザクション内でエラーが発生したため、すべての変更をロールバックしました",
        }
      );

      throw handleAIRecommendationError(error, {
        operation: "updateRecommendationsWithTransaction",
        sessionId,
        duration: transactionDuration,
        rollbackExecuted: true,
      });
    }
  }
}

/**
 * レコメンド保存サービスのシングルトンインスタンス
 */
export const recommendationSaverService = new RecommendationSaverService();
