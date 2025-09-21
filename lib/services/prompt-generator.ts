/**
 * プロンプト生成サービス
 *
 * このサービスは、カテゴリ別のプロンプトテンプレート管理と
 * ユーザーコンテキストを統合したAI用プロンプト生成を担当します。
 */

import { prisma } from "../prisma";
import type {
  ProcessedAnswer,
  PromptTemplate,
  PromptGeneratorService,
} from "../types/ai-recommendations";

/**
 * カテゴリ情報とキーポイント
 */
interface CategoryWithKeyPoints {
  id: string;
  name: string;
  description: string | null;
  keyPoints: Array<{
    id: string;
    point: string;
  }>;
  commonQuestions: Array<{
    id: string;
    question: string;
    answer: string | null;
  }>;
}

/**
 * ユーザープロフィール情報
 */

export class PromptGenerator implements PromptGeneratorService {
  /**
   * カテゴリ、ユーザープロフィール、回答に基づいてAI用プロンプトを生成する
   *
   * 要件: 1.4, 3.2
   * - Category テーブルの情報を活用したカテゴリ固有のプロンプト生成
   * - UserProfile テーブルの情報をプロンプトに組み込み
   * - 構造化された回答データをプロンプトに変換
   */
  async generatePrompt(
    categoryId: string,
    userProfile: Record<string, unknown>,
    answers: ProcessedAnswer[]
  ): Promise<string> {
    // カテゴリテンプレートを取得
    const template = await this.getCategoryTemplate(categoryId);

    // カテゴリの詳細情報を取得
    const categoryInfo = await this.getCategoryWithDetails(categoryId);

    // セッションコンテキストを取得（回答から推定）
    const sessionContext = await this.getSessionContext(answers);

    // ユーザーコンテキストを構築（UserProfileとセッション情報を統合）
    const userContext = this.buildUserContext(userProfile, sessionContext);

    // 回答データを構造化されたテキストに変換
    const answersText = this.formatAnswersForPrompt(answers);

    // カテゴリキーポイントを整理
    const keyPointsText = this.formatKeyPoints(categoryInfo.keyPoints);

    // 一般的な質問と回答を整理
    const commonQuestionsText = this.formatCommonQuestions(
      categoryInfo.commonQuestions
    );

    // テンプレートに値を代入してプロンプトを生成
    const prompt = this.interpolateTemplate(template, {
      categoryName: categoryInfo.name,
      categoryDescription: categoryInfo.description || "",
      keyPoints: keyPointsText,
      commonQuestions: commonQuestionsText,
      userContext,
      answers: answersText,
    });

    return prompt;
  }

  /**
   * カテゴリIDに基づいてプロンプトテンプレートを取得する
   *
   * 要件: 1.4, 3.1, 3.2
   * - Category テーブルの情報を活用したテンプレート管理
   * - カテゴリ固有のプロンプト生成ロジック
   */
  async getCategoryTemplate(categoryId: string): Promise<PromptTemplate> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!category) {
      throw new Error(`カテゴリが見つかりません: ${categoryId}`);
    }

    // カテゴリ名に基づいてテンプレートを選択
    const template = this.selectTemplateByCategory(category.name);

    return {
      categoryId: category.id,
      systemPrompt: template.systemPrompt,
      userPromptTemplate: template.userPromptTemplate,
      outputFormat: template.outputFormat,
    };
  }

  /**
   * カテゴリの詳細情報（キーポイント、一般的な質問）を取得する
   */
  private async getCategoryWithDetails(
    categoryId: string
  ): Promise<CategoryWithKeyPoints> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        keyPoints: {
          select: {
            id: true,
            point: true,
          },
          orderBy: {
            created_at: "asc",
          },
        },
        commonQuestions: {
          select: {
            id: true,
            question: true,
            answer: true,
          },
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    if (!category) {
      throw new Error(`カテゴリが見つかりません: ${categoryId}`);
    }

    return category;
  }

  /**
   * カテゴリ名に基づいてテンプレートを選択する
   *
   * 要件: 3.1, 3.2
   * - カテゴリ固有のプロンプト生成ロジック
   * - 異なる商品カテゴリに対応したテンプレート管理
   */
  private selectTemplateByCategory(categoryName: string): {
    systemPrompt: string;
    userPromptTemplate: string;
    outputFormat: string;
  } {
    // カテゴリ名を正規化（小文字、スペース除去）
    const normalizedName = categoryName.toLowerCase().replace(/\s+/g, "");

    // カテゴリ別のテンプレート定義
    const templates = {
      // スマートフォン関連
      smartphone: {
        systemPrompt: `あなたは経験豊富なスマートフォン専門家です。ユーザーの回答に基づいて、最適なスマートフォンを推薦してください。
価格、性能、カメラ機能、バッテリー持続時間、ブランドの信頼性を考慮して推薦を行ってください。`,
        userPromptTemplate: `## カテゴリ: {categoryName}
{categoryDescription}

## 重要なポイント:
{keyPoints}

## よくある質問と回答:
{commonQuestions}

## ユーザー情報:
{userContext}

## アンケート回答:
{answers}

上記の情報に基づいて、このユーザーに最適なスマートフォンを10個推薦してください。`,
        outputFormat: `JSON形式で以下の構造で回答してください:
{
  "recommendations": [
    {
      "productName": "商品名",
      "reason": "推薦理由（100文字以内）",
      "score": 85.5,
      "features": ["特徴1", "特徴2", "特徴3"],
      "priceRange": {"min": 50000, "max": 80000}
    }
  ]
}`,
      },

      // パソコン関連
      computer: {
        systemPrompt: `あなたは経験豊富なパソコン専門家です。ユーザーの用途と予算に基づいて、最適なパソコンを推薦してください。
CPU性能、メモリ容量、ストレージ、グラフィック性能、携帯性を考慮して推薦を行ってください。`,
        userPromptTemplate: `## カテゴリ: {categoryName}
{categoryDescription}

## 重要なポイント:
{keyPoints}

## よくある質問と回答:
{commonQuestions}

## ユーザー情報:
{userContext}

## アンケート回答:
{answers}

上記の情報に基づいて、このユーザーに最適なパソコンを10個推薦してください。`,
        outputFormat: `JSON形式で以下の構造で回答してください:
{
  "recommendations": [
    {
      "productName": "商品名",
      "reason": "推薦理由（100文字以内）",
      "score": 85.5,
      "features": ["特徴1", "特徴2", "特徴3"],
      "priceRange": {"min": 80000, "max": 150000}
    }
  ]
}`,
      },

      // 家電関連
      appliance: {
        systemPrompt: `あなたは経験豊富な家電製品専門家です。ユーザーのライフスタイルと住環境に基づいて、最適な家電製品を推薦してください。
機能性、省エネ性能、サイズ、価格、ブランドの信頼性を考慮して推薦を行ってください。`,
        userPromptTemplate: `## カテゴリ: {categoryName}
{categoryDescription}

## 重要なポイント:
{keyPoints}

## よくある質問と回答:
{commonQuestions}

## ユーザー情報:
{userContext}

## アンケート回答:
{answers}

上記の情報に基づいて、このユーザーに最適な家電製品を10個推薦してください。`,
        outputFormat: `JSON形式で以下の構造で回答してください:
{
  "recommendations": [
    {
      "productName": "商品名",
      "reason": "推薦理由（100文字以内）",
      "score": 85.5,
      "features": ["特徴1", "特徴2", "特徴3"],
      "priceRange": {"min": 30000, "max": 100000}
    }
  ]
}`,
      },
    };

    // カテゴリ名に基づいてテンプレートを選択
    if (
      normalizedName.includes("スマートフォン") ||
      normalizedName.includes("smartphone")
    ) {
      return templates.smartphone;
    } else if (
      normalizedName.includes("パソコン") ||
      normalizedName.includes("computer") ||
      normalizedName.includes("pc")
    ) {
      return templates.computer;
    } else if (
      normalizedName.includes("家電") ||
      normalizedName.includes("appliance")
    ) {
      return templates.appliance;
    }

    // デフォルトテンプレート（汎用）
    return {
      systemPrompt: `あなたは経験豊富な商品推薦専門家です。ユーザーの回答に基づいて、最適な商品を推薦してください。
品質、価格、機能性、ユーザーのニーズとの適合性を考慮して推薦を行ってください。`,
      userPromptTemplate: `## カテゴリ: {categoryName}
{categoryDescription}

## 重要なポイント:
{keyPoints}

## よくある質問と回答:
{commonQuestions}

## ユーザー情報:
{userContext}

## アンケート回答:
{answers}

上記の情報に基づいて、このユーザーに最適な商品を10個推薦してください。`,
      outputFormat: `JSON形式で以下の構造で回答してください:
{
  "recommendations": [
    {
      "productName": "商品名",
      "reason": "推薦理由（100文字以内）",
      "score": 85.5,
      "features": ["特徴1", "特徴2", "特徴3"],
      "priceRange": {"min": 10000, "max": 50000}
    }
  ]
}`,
    };
  }

  /**
   * 回答からセッションコンテキストを取得する
   *
   * 要件: 3.2
   * - QuestionnaireSession のコンテキストを含める
   */
  private async getSessionContext(
    answers: ProcessedAnswer[]
  ): Promise<Record<string, unknown>> {
    if (answers.length === 0) {
      return {};
    }

    try {
      // 最初の質問からセッション情報を取得
      const firstQuestionId = answers[0].questionId;

      const question = await prisma.question.findUnique({
        where: { id: firstQuestionId },
        include: {
          answers: {
            include: {
              session: {
                select: {
                  id: true,
                  status: true,
                  started_at: true,
                  completed_at: true,
                  userProfile: {
                    select: {
                      questionCount: true,
                      recommendationCount: true,
                    },
                  },
                },
              },
            },
            take: 1,
          },
        },
      });

      if (!question || !question.answers[0]?.session) {
        return {};
      }

      const session = question.answers[0].session;

      return {
        sessionId: session.id,
        sessionStatus: session.status,
        sessionDuration:
          session.completed_at && session.started_at
            ? Math.round(
                (session.completed_at.getTime() -
                  session.started_at.getTime()) /
                  1000 /
                  60
              ) // 分単位
            : null,
        userQuestionCount: session.userProfile?.questionCount || 0,
        userRecommendationCount: session.userProfile?.recommendationCount || 0,
      };
    } catch (error) {
      console.warn("セッションコンテキストの取得に失敗しました:", error);
      return {};
    }
  }

  /**
   * ユーザープロフィール情報からコンテキストテキストを構築する
   *
   * 要件: 1.4, 3.2
   * - UserProfile テーブルの情報をプロンプトに組み込み
   * - QuestionnaireSession のコンテキストを含める
   */
  private buildUserContext(
    userProfile: Record<string, unknown>,
    sessionContext: Record<string, unknown> = {}
  ): string {
    const contextParts: string[] = [];

    // ユーザープロフィール情報
    if (userProfile.fullName) {
      contextParts.push(`ユーザー名: ${userProfile.fullName}`);
    }

    // セッション情報
    if (sessionContext.sessionDuration) {
      contextParts.push(
        `アンケート回答時間: ${sessionContext.sessionDuration}分`
      );
    }

    if (sessionContext.userQuestionCount) {
      contextParts.push(
        `過去のアンケート回答数: ${sessionContext.userQuestionCount}回`
      );
    }

    if (sessionContext.userRecommendationCount) {
      contextParts.push(
        `過去のレコメンド取得数: ${sessionContext.userRecommendationCount}回`
      );
    }

    // 回答パターン分析
    if (
      userProfile.preferences &&
      typeof userProfile.preferences === "object"
    ) {
      const prefs = userProfile.preferences as Record<string, unknown>;

      if (prefs.totalQuestions) {
        contextParts.push(`今回の回答質問数: ${prefs.totalQuestions}`);
      }

      if (prefs.rangeAverages && typeof prefs.rangeAverages === "object") {
        const ranges = prefs.rangeAverages as Record<string, number>;
        if (ranges.average !== undefined) {
          contextParts.push(
            `平均重要度スコア: ${ranges.average.toFixed(1)}/100`
          );
        }
      }

      if (prefs.textLength && typeof prefs.textLength === "number") {
        if (prefs.textLength > 0) {
          contextParts.push(
            `詳細な回答を提供: ${
              prefs.textLength > 100 ? "はい（詳細）" : "はい（簡潔）"
            }`
          );
        }
      }

      // 質問タイプの分布
      if (prefs.questionTypes && typeof prefs.questionTypes === "object") {
        const types = prefs.questionTypes as Record<string, number>;
        const typeDescriptions: string[] = [];

        if (types.SINGLE_CHOICE)
          typeDescriptions.push(`選択式: ${types.SINGLE_CHOICE}問`);
        if (types.MULTIPLE_CHOICE)
          typeDescriptions.push(`複数選択: ${types.MULTIPLE_CHOICE}問`);
        if (types.RANGE) typeDescriptions.push(`スコア式: ${types.RANGE}問`);
        if (types.TEXT) typeDescriptions.push(`記述式: ${types.TEXT}問`);

        if (typeDescriptions.length > 0) {
          contextParts.push(`回答形式: ${typeDescriptions.join(", ")}`);
        }
      }
    }

    return contextParts.length > 0
      ? contextParts.join("\n")
      : "ユーザー情報は利用できません";
  }

  /**
   * 回答データをプロンプト用のテキスト形式に変換する
   *
   * 要件: 1.4, 3.2
   * - 構造化された回答データをプロンプトに変換
   */
  private formatAnswersForPrompt(answers: ProcessedAnswer[]): string {
    if (answers.length === 0) {
      return "回答データがありません";
    }

    const formattedAnswers = answers.map((answer, index) => {
      let answerText = "";

      // 質問タイプに基づいて回答を整形
      switch (answer.questionType) {
        case "SINGLE_CHOICE":
        case "MULTIPLE_CHOICE":
          answerText = `選択: ${answer.answer.optionLabel}`;
          break;
        case "RANGE":
          answerText = `スコア: ${answer.answer.rangeValue}/100`;
          break;
        case "TEXT":
          answerText = `回答: ${answer.answer.textValue}`;
          break;
        default:
          answerText = "不明な回答タイプ";
      }

      return `${index + 1}. ${answer.questionText}\n   ${answerText}`;
    });

    return formattedAnswers.join("\n\n");
  }

  /**
   * カテゴリキーポイントを整形する
   */
  private formatKeyPoints(
    keyPoints: Array<{ id: string; point: string }>
  ): string {
    if (keyPoints.length === 0) {
      return "キーポイントは設定されていません";
    }

    return keyPoints.map((kp, index) => `${index + 1}. ${kp.point}`).join("\n");
  }

  /**
   * 一般的な質問と回答を整形する
   */
  private formatCommonQuestions(
    commonQuestions: Array<{
      id: string;
      question: string;
      answer: string | null;
    }>
  ): string {
    if (commonQuestions.length === 0) {
      return "よくある質問は設定されていません";
    }

    return commonQuestions
      .map((cq) => {
        const answer = cq.answer || "回答は設定されていません";
        return `Q: ${cq.question}\nA: ${answer}`;
      })
      .join("\n\n");
  }

  /**
   * テンプレートに値を代入してプロンプトを生成する
   */
  private interpolateTemplate(
    template: PromptTemplate,
    values: Record<string, string>
  ): string {
    let prompt = `${template.systemPrompt}\n\n${template.userPromptTemplate}\n\n${template.outputFormat}`;

    // プレースホルダーを実際の値に置換
    for (const [key, value] of Object.entries(values)) {
      const placeholder = `{${key}}`;
      prompt = prompt.replace(new RegExp(placeholder, "g"), value);
    }

    return prompt;
  }
}

/**
 * PromptGeneratorのインスタンスを作成するファクトリ関数
 */
export function createPromptGenerator(): PromptGenerator {
  return new PromptGenerator();
}

/**
 * 便利のためのデフォルトエクスポート
 */
export default PromptGenerator;
