/**
 * 回答処理サービスの使用例
 *
 * このファイルは、AIレコメンド生成ワークフローで
 * AnswerProcessorサービスを使用する方法を示します。
 */

import { createAnswerProcessor } from "./answer-processor";
import type { ProcessedAnswer, AIInputData } from "../types/ai-recommendations";

/**
 * AIレコメンド生成のための回答処理方法を示す例関数
 */
export async function processAnswersForRecommendation(
  sessionId: string
): Promise<AIInputData> {
  try {
    // 回答プロセッサのインスタンスを作成
    const processor = createAnswerProcessor();

    // ステップ1: セッション回答を処理
    // セッションを検証し、JOINで回答を取得し、タイプ別に処理する
    const processedAnswers: ProcessedAnswer[] =
      await processor.processSessionAnswers(sessionId);

    console.log(
      `セッション ${sessionId} の ${processedAnswers.length} 件の回答を処理しました`
    );

    // ステップ2: AI処理用にデータを構造化
    // 回答をカテゴリとユーザープロフィールのコンテキストと組み合わせる
    const aiInputData: AIInputData = await processor.structureForAI(
      processedAnswers
    );

    console.log(
      `カテゴリのデータを構造化しました: ${aiInputData.categoryName}`
    );
    console.log(
      `ユーザーの好みを分析しました:`,
      aiInputData.userProfile.preferences
    );

    return aiInputData;
  } catch (error) {
    console.error("回答処理エラー:", error);
    throw error;
  }
}

/**
 * エラーハンドリングを示す例関数
 */
export async function processAnswersWithErrorHandling(
  sessionId: string
): Promise<AIInputData | null> {
  try {
    return await processAnswersForRecommendation(sessionId);
  } catch (error) {
    if (error instanceof Error) {
      // 特定のエラータイプを処理
      if (error.message.includes("見つかりません")) {
        console.error(`セッション ${sessionId} が見つかりません`);
        return null;
      }

      if (error.message.includes("完了していません")) {
        console.error(`セッション ${sessionId} はまだ完了していません`);
        return null;
      }

      if (error.message.includes("不足しています")) {
        console.error(
          `セッション ${sessionId} の回答データが無効です:`,
          error.message
        );
        return null;
      }
    }

    // 予期しないエラーを再スロー
    throw error;
  }
}

/**
 * 処理済み回答の検証方法を示す例関数
 */
export function validateProcessedAnswers(answers: ProcessedAnswer[]): boolean {
  if (answers.length === 0) {
    console.warn("検証する回答がありません");
    return false;
  }

  for (const answer of answers) {
    // 各回答が必要なフィールドを持っていることを確認
    if (!answer.questionId || !answer.questionText || !answer.questionType) {
      console.error("無効な回答構造:", answer);
      return false;
    }

    // 質問タイプに基づいて回答データが存在することを確認
    const hasAnswerData =
      answer.answer.optionLabel ||
      answer.answer.optionValue ||
      answer.answer.rangeValue !== undefined ||
      answer.answer.textValue;

    if (!hasAnswerData) {
      console.error("回答データが不足しています:", answer);
      return false;
    }
  }

  console.log(`${answers.length} 件の回答を正常に検証しました`);
  return true;
}

/**
 * 特定の回答タイプを抽出する方法を示す例関数
 */
export function extractAnswersByType(
  answers: ProcessedAnswer[],
  questionType: string
): ProcessedAnswer[] {
  return answers.filter((answer) => answer.questionType === questionType);
}

/**
 * 回答サマリーを取得する方法を示す例関数
 */
export function getAnswerSummary(
  answers: ProcessedAnswer[]
): Record<string, unknown> {
  const summary = {
    totalAnswers: answers.length,
    byType: {} as Record<string, number>,
    hasTextAnswers: false,
    rangeAnswerCount: 0,
    choiceAnswerCount: 0,
  };

  for (const answer of answers) {
    // タイプ別にカウント
    const type = answer.questionType;
    summary.byType[type] = (summary.byType[type] || 0) + 1;

    // 特定の回答タイプをチェック
    if (answer.answer.textValue) {
      summary.hasTextAnswers = true;
    }

    if (answer.answer.rangeValue !== undefined) {
      summary.rangeAnswerCount++;
    }

    if (answer.answer.optionValue) {
      summary.choiceAnswerCount++;
    }
  }

  return summary;
}
