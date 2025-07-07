// lib/validations/auth.ts
import { z } from "zod";

export const loginServerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください。"),
  password: z.string().min(1, "パスワードを入力してください。"),
});

// クライアントサイド用のログインフォームスキーマ
export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください。"),
  password: z.string().min(1, "パスワードを入力してください。"),
});

// 基本的なサインアップスキーマ（サーバーサイド用）
export const signupServerSchema = z.object({
  name: z.string().min(1, "お名前を入力してください。"),
  email: z.string().email("有効なメールアドレスを入力してください。"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
});

// フロントエンド用（パスワード確認と利用規約同意を含む）
export const signupSchema = z
  .object({
    name: z.string().min(1, "お名前を入力してください。"),
    email: z.string().email("有効なメールアドレスを入力してください。"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "利用規約に同意してください。",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません。",
    path: ["confirmPassword"],
  });

export type LoginServerData = z.infer<typeof loginServerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupServerData = z.infer<typeof signupServerSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
