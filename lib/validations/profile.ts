import { z } from "zod";
import { UserProfileSchema } from "./generated";
import { FORM_VALIDATION } from "@/lib/constants";

// ==============================
// プロフィール関連のスキーマ
// ==============================

// 作成用スキーマ（厳密なバリデーション）
export const CreateProfileSchema = z.object({
  username: z
    .string()
    .min(
      FORM_VALIDATION.USERNAME.MIN_LENGTH,
      "ユーザー名は3文字以上で入力してください"
    )
    .max(
      FORM_VALIDATION.USERNAME.MAX_LENGTH,
      "ユーザー名は20文字以下で入力してください"
    )
    .regex(
      FORM_VALIDATION.USERNAME.PATTERN,
      "ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます"
    )
    .optional(),
  full_name: z
    .string()
    .min(FORM_VALIDATION.FULL_NAME.MIN_LENGTH, "フルネームを入力してください")
    .max(
      FORM_VALIDATION.FULL_NAME.MAX_LENGTH,
      "フルネームは100文字以下で入力してください"
    )
    .optional(),
  avatar_url: z.string().url("正しいURLを入力してください").optional(),
});

// 更新用スキーマ（部分的な更新を許可）
export const UpdateProfileSchema = CreateProfileSchema.partial();

// サーバーサイド用の選択スキーマ
export const ProfileSelectSchema = UserProfileSchema.pick({
  id: true,
  userId: true,
  username: true,
  full_name: true,
  avatar_url: true,
  questionCount: true,
  recommendationCount: true,
  created_at: true,
  updated_at: true,
});

// FormData 用のスキーマ
export const ProfileFormDataSchema = z.object({
  username: z.string().optional(),
  full_name: z.string().optional(),
  avatar_url: z.string().optional(),
});

// ==============================
// 型定義の導出
// ==============================

// 基本的なプロフィール型（Prismaから生成）
export type { UserProfile } from "./generated";

// ビジネスロジック用の型定義
export type CreateProfileData = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
export type ProfileSelectData = z.infer<typeof ProfileSelectSchema>;
export type ProfileFormData = z.infer<typeof ProfileFormDataSchema>;

// ==============================
// バリデーションヘルパー関数
// ==============================

export function validateCreateProfile(data: unknown): {
  success: boolean;
  data?: CreateProfileData;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} {
  const result = CreateProfileSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const fieldErrors: Record<string, string[]> = {};
  result.error.errors.forEach((err) => {
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

export function validateUpdateProfile(data: unknown): {
  success: boolean;
  data?: UpdateProfileData;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} {
  const result = UpdateProfileSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const fieldErrors: Record<string, string[]> = {};
  result.error.errors.forEach((err) => {
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

// ==============================
// レスポンス用スキーマ
// ==============================

export const ProfileResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      profile: ProfileSelectSchema,
    })
    .optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
