/**
 * AnswerProcessor サービスのテスト
 *
 * 要件1.2と1.3の実装を検証するためのユニットテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { QuestionType } from "@prisma/client";
import { AnswerProcessor } from "../answer-processor";
import type { ProcessedAnswer } from "@/lib/types/ai-recommendations";

// Prismaクライアントのモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionnaireSession: {
      findUnique: vi.fn(),
    },
    answer: {
      findMany: vi.fn(),
    },
    question: {
      findUnique: vi.fn(),
    },
  },
}));

describe("AnswerProcessor", () => {
  let answerProcessor: AnswerProcessor;

  beforeEach(() => {
    answerProcessor = new AnswerProcessor();
    vi.clearAllMocks();
  });

  describe("質問タイプ別データ構造化", () => {
    it("SINGLE_CHOICE質問を正しく処理する", () => {
      const rawAnswer = {
        id: "answer1",
        questionnaireSessionId: "session1",
        questionId: "question1",
        questionOptionId: "option1",
        range_value: null,
        text_value: null,
        question: {
          id: "question1",
          text: "予算はどのくらいですか？",
          type: QuestionType.SINGLE_CHOICE,
          categoryId: "category1",
        },
        option: {
          id: "option1",
          label: "5万円以下",
          value: "50000",
        },
      };

      // プライベートメソッドをテストするためにany型でキャスト
      const result = (answerProcessor as any).processAnswer(rawAnswer);

      expect(result).toEqual({
        questionId: "question1",
        questionText: "予算はどのくらいですか？",
        questionType: QuestionType.SINGLE_CHOICE,
        answer: {
          optionLabel: "5万円以下",
          optionValue: "50000",
        },
      });
    });

    it("RANGE質問を正しく処理する", () => {
      const rawAnswer = {
        id: "answer2",
        questionnaireSessionId: "session1",
        questionId: "question2",
        questionOptionId: null,
        range_value: 75,
        text_value: null,
        question: {
          id: "question2",
          text: "画面サイズの重要度",
          type: QuestionType.RANGE,
          categoryId: "category1",
        },
        option: null,
      };

      const result = (answerProcessor as any).processAnswer(rawAnswer);

      expect(result).toEqual({
        questionId: "question2",
        questionText: "画面サイズの重要度",
        questionType: QuestionType.RANGE,
        answer: {
          rangeValue: 75,
        },
      });
    });

    it("TEXT質問を正しく処理する", () => {
      const rawAnswer = {
        id: "answer3",
        questionnaireSessionId: "session1",
        questionId: "question3",
        questionOptionId: null,
        range_value: null,
        text_value: "ゲームと動画視聴が主な用途です",
        question: {
          id: "question3",
          text: "主な用途を教えてください",
          type: QuestionType.TEXT,
          categoryId: "category1",
        },
        option: null,
      };

      const result = (answerProcessor as any).processAnswer(rawAnswer);

      expect(result).toEqual({
        questionId: "question3",
        questionText: "主な用途を教えてください",
        questionType: QuestionType.TEXT,
        answer: {
          textValue: "ゲームと動画視聴が主な用途です",
        },
      });
    });

    it("MULTIPLE_CHOICE質問を正しく処理する", () => {
      const rawAnswers = [
        {
          id: "answer4a",
          questionnaireSessionId: "session1",
          questionId: "question4",
          questionOptionId: "option4a",
          range_value: null,
          text_value: null,
          question: {
            id: "question4",
            text: "重視する機能は？",
            type: QuestionType.MULTIPLE_CHOICE,
            categoryId: "category1",
          },
          option: {
            id: "option4a",
            label: "カメラ性能",
            value: "camera",
          },
        },
        {
          id: "answer4b",
          questionnaireSessionId: "session1",
          questionId: "question4",
          questionOptionId: "option4b",
          range_value: null,
          text_value: null,
          question: {
            id: "question4",
            text: "重視する機能は？",
            type: QuestionType.MULTIPLE_CHOICE,
            categoryId: "category1",
          },
          option: {
            id: "option4b",
            label: "バッテリー持続時間",
            value: "battery",
          },
        },
      ];

      const result = (answerProcessor as any).processMultipleChoiceAnswers(
        rawAnswers
      );

      expect(result).toEqual({
        questionId: "question4",
        questionText: "重視する機能は？",
        questionType: QuestionType.MULTIPLE_CHOICE,
        answer: {
          optionLabel: "カメラ性能, バッテリー持続時間",
          optionValue: "camera,battery",
        },
      });
    });
  });

  describe("テキストサニタイゼーション", () => {
    it("メールアドレスを除去する", () => {
      const text = "お問い合わせは test@example.com までお願いします";
      const result = (answerProcessor as any).sanitizeTextInput(text);

      expect(result).toBe("お問い合わせは [EMAIL] までお願いします");
    });

    it("電話番号を除去する", () => {
      const text = "連絡先は 03-1234-5678 です";
      const result = (answerProcessor as any).sanitizeTextInput(text);

      expect(result).toBe("連絡先は [PHONE] です");
    });

    it("過剰な空白を正規化する", () => {
      const text = "  これは   テスト   です  ";
      const result = (answerProcessor as any).sanitizeTextInput(text);

      expect(result).toBe("これは テスト です");
    });

    it("長すぎるテキストを切り詰める", () => {
      const longText = "a".repeat(1500);
      const result = (answerProcessor as any).sanitizeTextInput(longText);

      expect(result).toHaveLength(1003); // 1000文字 + "..."
      expect(result.endsWith("...")).toBe(true);
    });
  });

  describe("回答パターン分析", () => {
    it("回答統計を正しく計算する", () => {
      const answers: ProcessedAnswer[] = [
        {
          questionId: "q1",
          questionText: "テスト質問1",
          questionType: QuestionType.SINGLE_CHOICE,
          answer: { optionLabel: "オプション1", optionValue: "opt1" },
        },
        {
          questionId: "q2",
          questionText: "テスト質問2",
          questionType: QuestionType.RANGE,
          answer: { rangeValue: 80 },
        },
        {
          questionId: "q3",
          questionText: "テスト質問3",
          questionType: QuestionType.RANGE,
          answer: { rangeValue: 60 },
        },
        {
          questionId: "q4",
          questionText: "テスト質問4",
          questionType: QuestionType.TEXT,
          answer: { textValue: "テストテキスト" },
        },
      ];

      const result = (answerProcessor as any).analyzeAnswerPatterns(answers);

      expect(result).toEqual({
        totalQuestions: 4,
        questionTypes: {
          SINGLE_CHOICE: 1,
          RANGE: 2,
          TEXT: 1,
        },
        rangeAverages: {
          average: 70,
          min: 60,
          max: 80,
        },
        textLength: 7, // 'テストテキスト'の文字数
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("SINGLE_CHOICE質問でオプションが不足している場合エラーを投げる", () => {
      const rawAnswer = {
        id: "answer1",
        questionnaireSessionId: "session1",
        questionId: "question1",
        questionOptionId: null,
        range_value: null,
        text_value: null,
        question: {
          id: "question1",
          text: "予算はどのくらいですか？",
          type: QuestionType.SINGLE_CHOICE,
          categoryId: "category1",
        },
        option: null,
      };

      expect(() => {
        (answerProcessor as any).processAnswer(rawAnswer);
      }).toThrow("単一選択質問 question1 でオプション選択が不足しています");
    });

    it("RANGE質問で範囲値が不足している場合エラーを投げる", () => {
      const rawAnswer = {
        id: "answer2",
        questionnaireSessionId: "session1",
        questionId: "question2",
        questionOptionId: null,
        range_value: null,
        text_value: null,
        question: {
          id: "question2",
          text: "画面サイズの重要度",
          type: QuestionType.RANGE,
          categoryId: "category1",
        },
        option: null,
      };

      expect(() => {
        (answerProcessor as any).processAnswer(rawAnswer);
      }).toThrow("範囲質問 question2 で範囲値が不足しています");
    });

    it("RANGE質問で範囲値が境界外の場合エラーを投げる", () => {
      const rawAnswer = {
        id: "answer2",
        questionnaireSessionId: "session1",
        questionId: "question2",
        questionOptionId: null,
        range_value: 150, // 境界外
        text_value: null,
        question: {
          id: "question2",
          text: "画面サイズの重要度",
          type: QuestionType.RANGE,
          categoryId: "category1",
        },
        option: null,
      };

      expect(() => {
        (answerProcessor as any).processAnswer(rawAnswer);
      }).toThrow("質問 question2 の範囲値 150 が境界外です（0-100）");
    });

    it("TEXT質問でテキスト値が空の場合エラーを投げる", () => {
      const rawAnswer = {
        id: "answer3",
        questionnaireSessionId: "session1",
        questionId: "question3",
        questionOptionId: null,
        range_value: null,
        text_value: "", // 空文字
        question: {
          id: "question3",
          text: "主な用途を教えてください",
          type: QuestionType.TEXT,
          categoryId: "category1",
        },
        option: null,
      };

      expect(() => {
        (answerProcessor as any).processAnswer(rawAnswer);
      }).toThrow("テキスト質問 question3 でテキスト値が不足しています");
    });
  });
});
