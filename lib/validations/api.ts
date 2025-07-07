import { z } from "zod";

// API共通のレスポンススキーマ
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// プロフィール関連のスキーマ
export const CreateProfileSchema = z.object({
  username: z
    .string()
    .min(1, "ユーザー名は必須です")
    .max(50, "ユーザー名は50文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "ユーザー名は英数字とアンダースコア、ハイフンのみ使用できます"
    ),
  full_name: z
    .string()
    .min(1, "フルネームは必須です")
    .max(100, "フルネームは100文字以内で入力してください"),
  avatar_url: z.string().url("正しいURLを入力してください").optional(),
});

export const UpdateProfileSchema = CreateProfileSchema.partial();

export type CreateProfileData = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;

// ページネーション
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

// エラーコード定義
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
