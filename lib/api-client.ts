// APIクライアント関数
export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

// 認証エラーかどうかを判定
export function isAuthError(error: any): boolean {
  return error instanceof ApiError && error.status === 401;
}

// 共通のAPI呼び出し関数
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${baseUrl}/api${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // クッキーを含める
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: "Unknown error" };
    }

    const apiError = new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );

    // 認証エラーの場合は特別な処理
    if (response.status === 401) {
      console.warn("認証エラーが発生しました:", apiError.message);
    }

    throw apiError;
  }

  return response.json();
}

// セッション関連API
export const sessionApi = {
  // セッション作成
  create: (categoryId: string) =>
    apiCall<{
      data: {
        session: {
          id: string;
          categoryId: string;
          status: string;
          started_at: string;
          isExisting: boolean;
        };
      };
    }>("/sessions", {
      method: "POST",
      body: JSON.stringify({ categoryId }),
    }),

  // セッション取得
  get: (sessionId: string) =>
    apiCall<{
      data: {
        session: {
          id: string;
          categoryId: string;
          status: string;
          started_at: string;
          completed_at?: string;
        };
      };
    }>(`/sessions/${sessionId}`),

  // セッション一覧取得
  list: () =>
    apiCall<{
      data: {
        sessions: Array<{
          id: string;
          categoryId: string;
          categoryName: string;
          status: string;
          started_at: string;
          completed_at?: string;
          answerCount: number;
        }>;
        total: number;
      };
    }>("/sessions"),

  // セッション完了
  complete: (sessionId: string) =>
    apiCall<{ success: boolean }>(`/sessions/${sessionId}/complete`, {
      method: "POST",
    }),

  // セッション再開
  resume: (sessionId: string) =>
    apiCall<{ success: boolean }>(`/sessions/${sessionId}/resume`, {
      method: "POST",
    }),
};

// 質問関連API
export const questionApi = {
  // カテゴリ別質問取得
  getByCategory: (categoryId: string) =>
    apiCall<{
      data: {
        category: {
          id: string;
          name: string;
        };
        questions: Array<{
          id: string;
          text: string;
          description?: string;
          type: string;
          is_required: boolean;
          options?: Array<{
            id: string;
            label: string;
            description?: string;
            value: string;
          }>;
        }>;
        total: number;
      };
    }>(`/questions/${categoryId}`),
};

// 回答関連API
export const answerApi = {
  // 回答保存
  save: (
    sessionId: string,
    answer: {
      questionId: string;
      questionOptionId?: string;
      questionOptionIds?: string[];
      range_value?: number;
      text_value?: string;
    }
  ) =>
    apiCall<{
      data: {
        answer: {
          id: string;
          questionId: string;
          questionText: string;
          questionType: string;
          questionOptionId?: string;
          questionOptionIds: string[];
          range_value?: number;
          text_value?: string;
          option?: {
            id: string;
            label: string;
            value: string;
          };
          created_at: string;
          updated_at: string;
        };
        isUpdate: boolean;
      };
    }>("/answers", {
      method: "POST",
      body: JSON.stringify({ sessionId, ...answer }),
    }),
};

// カテゴリ関連API
export const categoryApi = {
  // カテゴリ一覧取得
  list: () =>
    apiCall<{
      categories: Array<{
        id: string;
        name: string;
        description: string;
        icon?: string;
      }>;
    }>("/categories"),

  // カテゴリ詳細取得
  get: (categoryId: string) =>
    apiCall<{
      id: string;
      name: string;
      description: string;
      icon?: string;
    }>(`/categories/${categoryId}`),
};

// レコメンド関連API
export const recommendationApi = {
  // レコメンド生成
  generate: (sessionId: string) =>
    apiCall<{ recommendationId: string }>("/recommendations/generate", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),

  // レコメンド結果取得
  get: (recommendationId: string) =>
    apiCall<{
      id: string;
      sessionId: string;
      status: string;
      recommendations: Array<{
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl?: string;
        reason: string;
        score: number;
      }>;
      createdAt: string;
    }>(`/recommendations/${recommendationId}`),
};

// 履歴関連API
export const historyApi = {
  // 履歴一覧取得
  list: () =>
    apiCall<{
      history: Array<{
        sessionId: string;
        categoryId: string;
        categoryName: string;
        status: string;
        createdAt: string;
        recommendations?: Array<{
          id: string;
          name: string;
          score: number;
        }>;
      }>;
    }>("/history"),
};
