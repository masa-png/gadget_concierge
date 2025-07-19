// APIレスポンス型定義
export interface ApiQuestionOption {
  id: string;
  label: string;
  description?: string;
  value: string;
}

export interface ApiQuestion {
  id: string;
  text: string;
  description?: string;
  type: string;
  is_required: boolean;
  options?: ApiQuestionOption[];
}

export interface ApiQuestionsResponse {
  data: {
    questions: ApiQuestion[];
  };
}

export interface ApiSessionResponse {
  data: {
    session: {
      id: string;
      status: string;
      categoryId: string;
      userProfileId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface ApiAnswerRequest {
  questionId: string;
  questionOptionId?: string;
  questionOptionIds?: string[];
  range_value?: number;
  text_value?: string;
}

export interface ApiAnswerResponse {
  data: {
    answer: {
      id: string;
      questionId: string;
      questionOptionId?: string;
      questionOptionIds?: string[];
      range_value?: number;
      text_value?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

// 型変換関数
export function convertApiQuestionToClient(
  apiQuestion: ApiQuestion
): import("@/lib/types/questionnaire").Question {
  return {
    id: apiQuestion.id,
    text: apiQuestion.text,
    description: apiQuestion.description,
    type: apiQuestion.type as import("@/lib/types/questionnaire").QuestionType,
    is_required: apiQuestion.is_required,
    options: (apiQuestion.options || []).map((option) => ({
      id: option.id,
      label: option.label,
      description: option.description,
      value: option.value,
    })),
  };
}

export function convertApiQuestionsToClient(
  apiResponse: ApiQuestionsResponse
): import("@/lib/types/questionnaire").Question[] {
  if (!apiResponse?.data || !Array.isArray(apiResponse.data.questions)) {
    throw new Error("Invalid API response format");
  }

  return apiResponse.data.questions.map(convertApiQuestionToClient);
}

export function convertClientAnswerToApi(
  clientAnswer: import("@/lib/types/questionnaire").Answer
): ApiAnswerRequest {
  // 複数選択の場合は、questionOptionIds の最初の要素を questionOptionId として送信
  const questionOptionId =
    clientAnswer.questionOptionId ||
    (clientAnswer.questionOptionIds && clientAnswer.questionOptionIds.length > 0
      ? clientAnswer.questionOptionIds[0]
      : undefined);

  return {
    questionId: clientAnswer.questionId,
    questionOptionId: questionOptionId,
    questionOptionIds: clientAnswer.questionOptionIds,
    range_value: clientAnswer.range_value,
    text_value: clientAnswer.text_value,
  };
}
