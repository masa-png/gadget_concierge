export enum QuestionnaireErrorCode {
  AUTH_REQUIRED = "AUTH_REQUIRED",
  AUTH_LOADING = "AUTH_LOADING",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  QUESTIONS_NOT_FOUND = "QUESTIONS_NOT_FOUND",
  INVALID_ANSWER = "INVALID_ANSWER",
  NETWORK_ERROR = "NETWORK_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class QuestionnaireError extends Error {
  constructor(
    message: string,
    public code: QuestionnaireErrorCode,
    public context?: unknown
  ) {
    super(message);
    this.name = "QuestionnaireError";
  }
}

export const createQuestionnaireError = {
  authRequired: (context?: unknown) =>
    new QuestionnaireError(
      "ログインが必要です",
      QuestionnaireErrorCode.AUTH_REQUIRED,
      context
    ),

  authLoading: (context?: unknown) =>
    new QuestionnaireError(
      "認証状態を確認中です...",
      QuestionnaireErrorCode.AUTH_LOADING,
      context
    ),

  sessionNotFound: (context?: unknown) =>
    new QuestionnaireError(
      "セッションが見つかりません",
      QuestionnaireErrorCode.SESSION_NOT_FOUND,
      context
    ),

  questionsNotFound: (context?: unknown) =>
    new QuestionnaireError(
      "質問データの取得に失敗しました",
      QuestionnaireErrorCode.QUESTIONS_NOT_FOUND,
      context
    ),

  invalidAnswer: (message: string, context?: unknown) =>
    new QuestionnaireError(
      message,
      QuestionnaireErrorCode.INVALID_ANSWER,
      context
    ),

  networkError: (context?: unknown) =>
    new QuestionnaireError(
      "サーバーに接続できません。ネットワークやサーバー状態を確認してください。",
      QuestionnaireErrorCode.NETWORK_ERROR,
      context
    ),

  rateLimited: (context?: unknown) =>
    new QuestionnaireError(
      "リクエストが多すぎます。しばらく待ってから再度お試しください。",
      QuestionnaireErrorCode.RATE_LIMITED,
      context
    ),

  validationError: (message: string, context?: unknown) =>
    new QuestionnaireError(
      message,
      QuestionnaireErrorCode.VALIDATION_ERROR,
      context
    ),

  unknown: (originalError: unknown, context?: unknown) =>
    new QuestionnaireError(
      originalError instanceof Error
        ? originalError.message
        : "予期しないエラーが発生しました",
      QuestionnaireErrorCode.UNKNOWN_ERROR,
      { originalError, ...(context && typeof context === 'object' ? context : {}) }
    ),
};

export function handleQuestionnaireError(error: unknown): QuestionnaireError {
  if (error instanceof QuestionnaireError) {
    return error;
  }

  if (error instanceof Error) {
    // API エラーの場合
    if ("status" in error) {
      const status = (error as { status: number }).status;
      switch (status) {
        case 401:
          return createQuestionnaireError.authRequired({
            originalError: error,
          });
        case 429:
          return createQuestionnaireError.rateLimited({ originalError: error });
        default:
          return createQuestionnaireError.unknown(error);
      }
    }

    // ネットワークエラーの場合
    if (error instanceof TypeError) {
      return createQuestionnaireError.networkError({ originalError: error });
    }

    return createQuestionnaireError.unknown(error);
  }

  return createQuestionnaireError.unknown(error);
}

export function getErrorMessage(error: QuestionnaireError): string {
  return error.message;
}

export function getErrorCode(
  error: QuestionnaireError
): QuestionnaireErrorCode {
  return error.code;
}

export function isRetryableError(error: QuestionnaireError): boolean {
  return [
    QuestionnaireErrorCode.NETWORK_ERROR,
    QuestionnaireErrorCode.UNKNOWN_ERROR,
  ].includes(error.code);
}

export function isAuthError(error: QuestionnaireError): boolean {
  return [
    QuestionnaireErrorCode.AUTH_REQUIRED,
    QuestionnaireErrorCode.AUTH_LOADING,
  ].includes(error.code);
}
