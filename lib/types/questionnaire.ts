// 質問タイプの定義
export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  RANGE = "RANGE",
  TEXT = "TEXT",
}

// 質問データの型定義
export interface QuestionOption {
  id: string;
  label: string;
  description?: string;
  icon_url?: string;
  value: string;
}

export interface Question {
  id: string;
  text: string;
  description?: string;
  type: QuestionType;
  is_required: boolean;
  options?: QuestionOption[];
}

// 回答データの型定義
export interface Answer {
  questionId: string;
  questionOptionId?: string;
  questionOptionIds?: string[];
  range_value?: number;
  text_value?: string;
}

// フロー状態の型定義
export interface QuestionFlowState {
  sessionId: string | null;
  categoryId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, Answer>;
  isLoading: boolean;
  error: string | null;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isCompleted: boolean;
}
