import { z } from "zod";

/**
 * アプリケーション専用のエラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public field?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * バリデーションエラークラス
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public fieldErrors: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

/**
 * 認証エラークラス
 */
export class AuthError extends AppError {
  constructor(message: string = "認証が必要です") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthError";
  }
}

/**
 * データベースエラークラス
 */
export class DatabaseError extends AppError {
  constructor(message: string = "データベースエラーが発生しました") {
    super(message, "DATABASE_ERROR", 500);
    this.name = "DatabaseError";
  }
}

/**
 * Zodバリデーションエラーをフィールドエラーに変換
 */
export function formatZodError(error: z.ZodError): {
  success: false;
  error: string;
  fieldErrors: Record<string, string[]>;
} {
  const fieldErrors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(err.message);
  });

  return {
    success: false,
    error: "入力値が正しくありません",
    fieldErrors,
  };
}

/**
 * Prismaエラーをアプリケーションエラーに変換
 */
export function formatPrismaError(error: any): {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
} {
  // 重複エラー
  if (error.code === "P2002") {
    const target = error.meta?.target;
    const field = Array.isArray(target) ? target[0] : target;
    
    let message = "既に存在するデータです";
    let fieldErrors: Record<string, string[]> = {};
    
    if (field === "username") {
      message = "このユーザー名は既に使用されています";
      fieldErrors = { username: ["このユーザー名は既に使用されています"] };
    } else if (field === "email") {
      message = "このメールアドレスは既に使用されています";
      fieldErrors = { email: ["このメールアドレスは既に使用されています"] };
    }
    
    return {
      success: false,
      error: message,
      fieldErrors,
    };
  }
  
  // 外部キー制約エラー
  if (error.code === "P2003") {
    return {
      success: false,
      error: "関連するデータが見つかりません",
    };
  }
  
  // レコードが見つからない
  if (error.code === "P2025") {
    return {
      success: false,
      error: "データが見つかりません",
    };
  }
  
  console.error("Prisma error:", error);
  return {
    success: false,
    error: "データベースエラーが発生しました",
  };
}

/**
 * Server Action用の統一エラーハンドラー
 */
export function handleServerActionError(error: unknown): {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
} {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      fieldErrors: error.fieldErrors,
    };
  }
  
  if (error instanceof AuthError) {
    return {
      success: false,
      error: error.message,
    };
  }
  
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
    };
  }
  
  // Zodエラー
  if (error instanceof z.ZodError) {
    return formatZodError(error);
  }
  
  // Prismaエラー
  if (error && typeof error === "object" && "code" in error) {
    return formatPrismaError(error);
  }
  
  // 一般的なエラー
  if (error instanceof Error) {
    console.error("Server Action error:", error);
    return {
      success: false,
      error: error.message || "予期しないエラーが発生しました",
    };
  }
  
  console.error("Unknown error:", error);
  return {
    success: false,
    error: "予期しないエラーが発生しました",
  };
}

/**
 * API Route用の統一エラーハンドラー
 */
export function handleApiError(error: unknown): {
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
} {
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      status: 400,
      fieldErrors: error.fieldErrors,
    };
  }
  
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: 401,
    };
  }
  
  if (error instanceof AppError) {
    return {
      message: error.message,
      status: error.statusCode || 500,
    };
  }
  
  // Zodエラー
  if (error instanceof z.ZodError) {
    const formatted = formatZodError(error);
    return {
      message: formatted.error,
      status: 400,
      fieldErrors: formatted.fieldErrors,
    };
  }
  
  // Prismaエラー
  if (error && typeof error === "object" && "code" in error) {
    const formatted = formatPrismaError(error);
    return {
      message: formatted.error,
      status: 400,
      fieldErrors: formatted.fieldErrors,
    };
  }
  
  // 一般的なエラー
  if (error instanceof Error) {
    console.error("API error:", error);
    return {
      message: error.message || "サーバーエラーが発生しました",
      status: 500,
    };
  }
  
  console.error("Unknown API error:", error);
  return {
    message: "サーバーエラーが発生しました",
    status: 500,
  };
}

/**
 * クライアント側での統一エラーハンドラー
 */
export function handleClientError(error: unknown): {
  message: string;
  isNetworkError: boolean;
  isValidationError: boolean;
  fieldErrors?: Record<string, string[]>;
} {
  // ネットワークエラー
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      message: "ネットワークエラーが発生しました。接続を確認してください。",
      isNetworkError: true,
      isValidationError: false,
    };
  }
  
  // Server Actionの結果
  if (error && typeof error === "object" && "success" in error && !error.success) {
    const actionError = error as { success: false; error: string; fieldErrors?: Record<string, string[]> };
    return {
      message: actionError.error,
      isNetworkError: false,
      isValidationError: !!actionError.fieldErrors,
      fieldErrors: actionError.fieldErrors,
    };
  }
  
  // 一般的なエラー
  if (error instanceof Error) {
    return {
      message: error.message || "予期しないエラーが発生しました",
      isNetworkError: false,
      isValidationError: false,
    };
  }
  
  return {
    message: "予期しないエラーが発生しました",
    isNetworkError: false,
    isValidationError: false,
  };
}

/**
 * エラーメッセージを日本語に変換
 */
export function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    "Required": "必須項目です",
    "Invalid email": "正しいメールアドレスを入力してください",
    "Password must be at least 8 characters": "パスワードは8文字以上で入力してください",
    "Username already exists": "このユーザー名は既に使用されています",
    "Email already exists": "このメールアドレスは既に使用されています",
    "User not found": "ユーザーが見つかりません",
    "Invalid credentials": "メールアドレスまたはパスワードが正しくありません",
    "Unauthorized": "認証が必要です",
    "Forbidden": "アクセスが拒否されました",
    "Not found": "データが見つかりません",
    "Internal server error": "サーバーエラーが発生しました",
    "Network error": "ネットワークエラーが発生しました",
  };
  
  return translations[message] || message;
}