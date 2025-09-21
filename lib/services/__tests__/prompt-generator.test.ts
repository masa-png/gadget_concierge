/**
 * プロンプト生成サービスのテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PromptGenerator } from "../prompt-generator";
import { QuestionType } from "@prisma/client";
import type { ProcessedAnswer } from "../../types/ai-recommendations";

// Prismaクライアントをモック
vi.mock("../../prisma", () => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
    },
    question: {
      findUnique: vi.fn(),
    },
  },
}));

describe("PromptGenerator", () => {
  let promptGenerator: PromptGenerator;

  beforeEach(() => {
    promptGenerator = new PromptGenerator();
    vi.clearAllMocks();
  });

  describe("getCategoryTemplate", () => {
    it("スマートフォンカテゴリのテンプレートを正しく選択する", async () => {
      const mockCategory = {
        id: "category-1",
        name: "スマートフォン",
        description: "スマートフォンの選択",
        parentId: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { prisma } = await import("../../prisma");
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

      const template = await promptGenerator.getCategoryTemplate("category-1");

      expect(template.categoryId).toBe("category-1");
      expect(template.systemPrompt).toContain("スマートフォン専門家");
      expect(template.userPromptTemplate).toContain("{categoryName}");
      expect(template.outputFormat).toContain("JSON形式");
    });

    it("パソコンカテゴリのテンプレートを正しく選択する", async () => {
      const mockCategory = {
        id: "category-2",
        name: "パソコン",
        description: "パソコンの選択",
        parentId: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { prisma } = await import("../../prisma");
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory);

      const template = await promptGenerator.getCategoryTemplate("category-2");

      expect(template.systemPrompt).toContain("パソコン専門家");
    });

    it("存在しないカテゴリでエラーを投げる", async () => {
      const { prisma } = await import("../../prisma");
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(
        promptGenerator.getCategoryTemplate("invalid-category")
      ).rejects.toThrow("カテゴリが見つかりません");
    });
  });

  describe("generatePrompt", () => {
    const mockAnswers: ProcessedAnswer[] = [
      {
        questionId: "q1",
        questionText: "予算はどのくらいですか？",
        questionType: QuestionType.SINGLE_CHOICE,
        answer: {
          optionLabel: "5万円以下",
          optionValue: "50000",
        },
      },
      {
        questionId: "q2",
        questionText: "重要度を教えてください",
        questionType: QuestionType.RANGE,
        answer: {
          rangeValue: 85,
        },
      },
    ];

    const mockUserProfile = {
      fullName: "テストユーザー",
      preferences: {
        totalQuestions: 2,
        rangeAverages: { average: 85 },
        textLength: 0,
        questionTypes: { SINGLE_CHOICE: 1, RANGE: 1 },
      },
    };

    it("完全なプロンプトを生成する", async () => {
      const mockCategory = {
        id: "category-1",
        name: "スマートフォン",
        description: "スマートフォンの選択",
        parentId: null,
        created_at: new Date(),
        updated_at: new Date(),
        keyPoints: [
          { id: "kp1", point: "価格を重視する" },
          { id: "kp2", point: "性能を重視する" },
        ],
        commonQuestions: [
          {
            id: "cq1",
            question: "どのブランドがおすすめですか？",
            answer: "用途によって異なります",
          },
        ],
      };

      const mockQuestion = {
        id: "q1",
        categoryId: "category-1",
        text: "テスト質問",
        description: null,
        type: QuestionType.SINGLE_CHOICE,
        is_required: true,
        created_at: new Date(),
        updated_at: new Date(),
        answers: [
          {
            session: {
              id: "session-1",
              status: "COMPLETED",
              started_at: new Date("2024-01-01T10:00:00Z"),
              completed_at: new Date("2024-01-01T10:05:00Z"),
              userProfile: {
                questionCount: 5,
                recommendationCount: 2,
              },
            },
          },
        ],
      };

      const { prisma } = await import("../../prisma");
      vi.mocked(prisma.category.findUnique)
        .mockResolvedValueOnce({
          id: "category-1",
          name: "スマートフォン",
          description: "スマートフォンの選択",
          parentId: null,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .mockResolvedValueOnce(mockCategory);

      vi.mocked(prisma.question.findUnique).mockResolvedValue(mockQuestion);

      const prompt = await promptGenerator.generatePrompt(
        "category-1",
        mockUserProfile,
        mockAnswers
      );

      expect(prompt).toContain("スマートフォン専門家");
      expect(prompt).toContain("テストユーザー");
      expect(prompt).toContain("予算はどのくらいですか？");
      expect(prompt).toContain("5万円以下");
      expect(prompt).toContain("価格を重視する");
      expect(prompt).toContain("アンケート回答時間: 5分");
    });
  });

  describe("formatAnswersForPrompt", () => {
    it("異なる質問タイプの回答を正しく整形する", () => {
      const answers: ProcessedAnswer[] = [
        {
          questionId: "q1",
          questionText: "ブランドを選択してください",
          questionType: QuestionType.SINGLE_CHOICE,
          answer: { optionLabel: "Apple", optionValue: "apple" },
        },
        {
          questionId: "q2",
          questionText: "重要度を評価してください",
          questionType: QuestionType.RANGE,
          answer: { rangeValue: 75 },
        },
        {
          questionId: "q3",
          questionText: "その他の要望",
          questionType: QuestionType.TEXT,
          answer: { textValue: "軽量で持ちやすいものが良い" },
        },
      ];

      // プライベートメソッドをテストするためにany型でキャスト
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (promptGenerator as any).formatAnswersForPrompt(answers);

      expect(result).toContain("1. ブランドを選択してください");
      expect(result).toContain("選択: Apple");
      expect(result).toContain("2. 重要度を評価してください");
      expect(result).toContain("スコア: 75/100");
      expect(result).toContain("3. その他の要望");
      expect(result).toContain("回答: 軽量で持ちやすいものが良い");
    });
  });
});
