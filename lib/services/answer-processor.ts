/**
 * 回答データ処理サービス
 *
 * このサービスは、データベースからのアンケート回答の取得と処理を担当し、
 * 効率的なJOINクエリとAI処理用のデータ構造化を含みます。
 */

import { prisma } from "../prisma";
import { QuestionType } from "@prisma/client";
import type {
  ProcessedAnswer,
  AIInputData,
  AnswerProcessorService,
} from "../types/ai-recommendations";

/**
 * データベースからのJOIN結果を含む生の回答データ
 */
interface RawAnswerData {
  id: string;
  questionnaireSessionId: string;
  questionId: string;
  questionOptionId: string | null;
  range_value: number | null;
  text_value: string | null;
  question: {
    id: string;
    text: string;
    type: QuestionType;
    categoryId: string;
  };
  option: {
    id: string;
    label: string;
    value: string;
  } | null;
}

/**
 * カテゴリ情報を含むセッションデータ
 */
interface SessionWithCategory {
  id: string;
  categoryId: string | null;
  userProfileId: string;
  status: string;
  category: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  userProfile: {
    id: string;
    userId: string;
    full_name: string | null;
  };
}

export class AnswerProcessor implements AnswerProcessorService {
  /**
   * 完了したアンケートセッションのすべての回答を取得・処理する
   *
   * 要件: 1.2, 1.3
   * - セッションが存在し完了していることを検証
   * - Answer、Question、QuestionOptionテーブルとの効率的なJOINクエリを実行
   * - AI処理用の構造化された回答データを返却
   */
  async processSessionAnswers(sessionId: string): Promise<ProcessedAnswer[]> {
    // まず、セッションが存在し完了していることを検証
    await this.validateSession(sessionId);

    // 効率的なJOINクエリで回答を取得
    const rawAnswers = await this.retrieveAnswersWithJoins(sessionId);

    // 複数選択の処理のために質問ごとに回答をグループ化
    const groupedAnswers = this.groupAnswersByQuestion(rawAnswers);

    // 質問タイプに基づいて各質問の回答を処理
    const processedAnswers = this.processGroupedAnswers(groupedAnswers);

    return processedAnswers;
  }

  /**
   * 処理済み回答をAI対応形式に構造化する
   *
   * 要件: 1.3, 3.4
   * - 回答をカテゴリとユーザープロフィールのコンテキストと組み合わせ
   * - AI処理用の統一データ形式を作成
   * - より良いAIレコメンドのための追加コンテキストでデータを充実
   */
  async structureForAI(answers: ProcessedAnswer[]): Promise<AIInputData> {
    if (answers.length === 0) {
      throw new Error("AI構造化のための回答が提供されていません");
    }

    // 最初の回答からカテゴリ情報を取得
    const firstAnswer = answers[0];
    const categoryInfo = await this.getCategoryInfo(firstAnswer.questionId);

    // ユーザープロフィール情報を取得
    const userProfileData = await this.getUserProfileFromAnswers(answers);

    // 追加コンテキストのために回答パターンを分析
    const answerAnalysis = this.analyzeAnswerPatterns(answers);

    return {
      categoryId: categoryInfo.id,
      categoryName: categoryInfo.name,
      userProfile: {
        ...userProfileData,
        preferences: answerAnalysis,
      },
      answers,
    };
  }

  /**
   * ユーザーの好みを抽出するために回答パターンを分析する
   *
   * 要件: 3.4
   * - 回答パターンから洞察を抽出
   * - AI処理のための追加コンテキストを提供
   */
  private analyzeAnswerPatterns(
    answers: ProcessedAnswer[]
  ): Record<string, unknown> {
    const analysis: Record<string, unknown> = {
      totalQuestions: answers.length,
      questionTypes: {},
      rangeAverages: {},
      textLength: 0,
    };

    // 質問タイプをカウント
    const typeCounts: Record<string, number> = {};
    let totalTextLength = 0;
    const rangeValues: number[] = [];

    for (const answer of answers) {
      const type = answer.questionType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      // 範囲値を分析
      if (answer.answer.rangeValue !== undefined) {
        rangeValues.push(answer.answer.rangeValue);
      }

      // テキスト長を分析
      if (answer.answer.textValue) {
        totalTextLength += answer.answer.textValue.length;
      }
    }

    analysis.questionTypes = typeCounts;
    analysis.textLength = totalTextLength;

    // 範囲統計を計算
    if (rangeValues.length > 0) {
      analysis.rangeAverages = {
        average:
          rangeValues.reduce((sum, val) => sum + val, 0) / rangeValues.length,
        min: Math.min(...rangeValues),
        max: Math.max(...rangeValues),
      };
    }

    return analysis;
  }

  /**
   * アンケートセッションが存在し完了していることを検証する
   */
  private async validateSession(
    sessionId: string
  ): Promise<SessionWithCategory> {
    const session = await prisma.questionnaireSession.findUnique({
      where: { id: sessionId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        userProfile: {
          select: {
            id: true,
            userId: true,
            full_name: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error(`アンケートセッションが見つかりません: ${sessionId}`);
    }

    if (session.status !== "COMPLETED") {
      throw new Error(
        `セッションが完了していません。現在のステータス: ${session.status}`
      );
    }

    return session;
  }

  /**
   * 効率的なJOINクエリで回答を取得する
   *
   * 最適なパフォーマンスのために、QuestionとQuestionOptionテーブルとのJOINを実行し、
   * 単一クエリで必要なすべてのデータを取得する
   */
  private async retrieveAnswersWithJoins(
    sessionId: string
  ): Promise<RawAnswerData[]> {
    const answers = await prisma.answer.findMany({
      where: {
        questionnaireSessionId: sessionId,
      },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            type: true,
            categoryId: true,
          },
        },
        option: {
          select: {
            id: true,
            label: true,
            value: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return answers;
  }

  /**
   * 質問タイプに基づいて個別の回答を処理する
   *
   * 要件: 1.3, 3.4
   * - SINGLE_CHOICE、MULTIPLE_CHOICE、RANGE、TEXT質問タイプを処理
   * - 統一されたProcessedAnswer形式に変換
   * - 回答データの整合性を検証
   */
  private processAnswer(rawAnswer: RawAnswerData): ProcessedAnswer {
    const { question, option, range_value, text_value } = rawAnswer;

    const processedAnswer: ProcessedAnswer = {
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      answer: {},
    };

    // 質問タイプに基づいて検証付きで回答を処理
    switch (question.type) {
      case QuestionType.SINGLE_CHOICE:
        if (!option) {
          throw new Error(
            `単一選択質問 ${question.id} でオプション選択が不足しています`
          );
        }
        processedAnswer.answer.optionLabel = option.label;
        processedAnswer.answer.optionValue = option.value;
        break;

      case QuestionType.MULTIPLE_CHOICE:
        // 複数選択の場合、オプションが選択されていることを期待
        if (!option) {
          throw new Error(
            `複数選択質問 ${question.id} でオプション選択が不足しています`
          );
        }
        processedAnswer.answer.optionLabel = option.label;
        processedAnswer.answer.optionValue = option.value;
        break;

      case QuestionType.RANGE:
        if (range_value === null || range_value === undefined) {
          throw new Error(`範囲質問 ${question.id} で範囲値が不足しています`);
        }
        // 範囲値が期待される境界内（0-100）にあることを検証
        if (range_value < 0 || range_value > 100) {
          throw new Error(
            `質問 ${question.id} の範囲値 ${range_value} が境界外です（0-100）`
          );
        }
        processedAnswer.answer.rangeValue = range_value;
        break;

      case QuestionType.TEXT:
        if (!text_value || text_value.trim() === "") {
          throw new Error(
            `テキスト質問 ${question.id} でテキスト値が不足しています`
          );
        }
        // AI処理のためにテキスト入力をサニタイズ
        processedAnswer.answer.textValue = this.sanitizeTextInput(text_value);
        break;

      default:
        throw new Error(`サポートされていない質問タイプ: ${question.type}`);
    }

    return processedAnswer;
  }

  /**
   * 複数選択質問を処理するために質問IDで回答をグループ化する
   *
   * 要件: 1.3, 3.4
   * - 複数選択質問が複数の回答を持つケースを処理
   * - 一貫した処理のために回答の順序を維持
   */
  private groupAnswersByQuestion(
    rawAnswers: RawAnswerData[]
  ): Map<string, RawAnswerData[]> {
    const grouped = new Map<string, RawAnswerData[]>();

    for (const answer of rawAnswers) {
      const questionId = answer.questionId;
      if (!grouped.has(questionId)) {
        grouped.set(questionId, []);
      }
      grouped.get(questionId)!.push(answer);
    }

    return grouped;
  }

  /**
   * グループ化された回答をProcessedAnswer形式に処理する
   *
   * 要件: 1.3, 3.4
   * - 質問ごとの単一および複数回答を処理
   * - 各質問タイプに適したデータ構造を作成
   */
  private processGroupedAnswers(
    groupedAnswers: Map<string, RawAnswerData[]>
  ): ProcessedAnswer[] {
    const processedAnswers: ProcessedAnswer[] = [];

    for (const [questionId, answers] of Array.from(groupedAnswers.entries())) {
      if (answers.length === 0) continue;

      const firstAnswer = answers[0];
      const questionType = firstAnswer.question.type;

      // 異なる質問タイプを処理
      switch (questionType) {
        case QuestionType.MULTIPLE_CHOICE:
          // 複数選択の場合、選択されたすべてのオプションを結合
          processedAnswers.push(this.processMultipleChoiceAnswers(answers));
          break;

        case QuestionType.SINGLE_CHOICE:
        case QuestionType.RANGE:
        case QuestionType.TEXT:
          // その他のタイプの場合、回答は1つのみであるべき
          if (answers.length > 1) {
            throw new Error(
              `タイプ ${questionType} の質問 ${questionId} に複数の回答があります`
            );
          }
          processedAnswers.push(this.processAnswer(firstAnswer));
          break;

        default:
          throw new Error(`サポートされていない質問タイプ: ${questionType}`);
      }
    }

    return processedAnswers;
  }

  /**
   * 複数選択回答を単一のProcessedAnswerに処理する
   *
   * 要件: 1.3, 3.4
   * - 複数の選択されたオプションを構造化された形式に結合
   * - AI処理のためにオプションラベルと値を維持
   */
  private processMultipleChoiceAnswers(
    answers: RawAnswerData[]
  ): ProcessedAnswer {
    const firstAnswer = answers[0];
    const question = firstAnswer.question;

    const selectedOptions = answers
      .filter((answer) => answer.option !== null)
      .map((answer) => ({
        label: answer.option!.label,
        value: answer.option!.value,
      }));

    if (selectedOptions.length === 0) {
      throw new Error(
        `複数選択質問 ${question.id} で有効なオプションが選択されていません`
      );
    }

    return {
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      answer: {
        // 複数選択の場合、カンマ区切り値として保存
        optionLabel: selectedOptions.map((opt) => opt.label).join(", "),
        optionValue: selectedOptions.map((opt) => opt.value).join(","),
      },
    };
  }

  /**
   * AI処理のためにテキスト入力をサニタイズする
   *
   * 要件: 3.4
   * - 潜在的に有害なコンテンツを除去
   * - テキスト形式を正規化
   * - AI分析のために意味のあるコンテンツを保持
   */
  private sanitizeTextInput(text: string): string {
    // 基本的なサニタイゼーション - 過剰な空白を除去し正規化
    let sanitized = text.trim().replace(/\s+/g, " ");

    // 潜在的なPIIパターンを除去（基本実装）
    // メールアドレス
    sanitized = sanitized.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      "[EMAIL]"
    );

    // 電話番号（基本的な日本のパターン）
    sanitized = sanitized.replace(/\b\d{2,4}-\d{2,4}-\d{4}\b/g, "[PHONE]");
    sanitized = sanitized.replace(/\b\d{10,11}\b/g, "[PHONE]");

    // 過剰な入力を防ぐために長さを制限
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000) + "...";
    }

    return sanitized;
  }

  /**
   * 質問IDからカテゴリ情報を取得する
   */
  private async getCategoryInfo(
    questionId: string
  ): Promise<{ id: string; name: string }> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!question || !question.category) {
      throw new Error(`質問のカテゴリが見つかりません: ${questionId}`);
    }

    return question.category;
  }

  /**
   * セッションからユーザープロフィール情報を取得する
   */
  private async getUserProfileFromAnswers(
    answers: ProcessedAnswer[]
  ): Promise<Record<string, unknown>> {
    if (answers.length === 0) {
      return {};
    }

    // カテゴリを見つけてからセッションを取得するために最初の質問を取得
    const firstQuestionId = answers[0].questionId;

    const question = await prisma.question.findUnique({
      where: { id: firstQuestionId },
      include: {
        answers: {
          include: {
            session: {
              include: {
                userProfile: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!question || !question.answers[0]?.session?.userProfile) {
      return {};
    }

    const userProfile = question.answers[0].session.userProfile;

    return {
      fullName: userProfile.full_name,
      userId: userProfile.userId,
    };
  }
}

/**
 * AnswerProcessorのインスタンスを作成するファクトリ関数
 */
export function createAnswerProcessor(): AnswerProcessor {
  return new AnswerProcessor();
}

/**
 * 便利のためのデフォルトエクスポート
 */
export default AnswerProcessor;
