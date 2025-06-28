"use server";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const emailSchema = z
  .string()
  .email("有効なメールアドレスを入力してください。");

export async function resendConfirmationEmail(email: string) {
  // バリデーション
  const validationResult = emailSchema.safeParse(email);

  if (!validationResult.success) {
    return { error: "有効なメールアドレスを入力してください。" };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: validationResult.data,
    });

    if (error) {
      console.error("Resend confirmation email error:", error);

      // エラーメッセージの処理
      if (error.message.includes("Email rate limit exceeded")) {
        return {
          error: "メール送信の制限に達しました。しばらくお待ちください。",
        };
      }
      if (error.message.includes("User not found")) {
        return { error: "このメールアドレスは登録されていません。" };
      }
      if (error.message.includes("Email already confirmed")) {
        return {
          error: "このメールアドレスは既に確認済みです。ログインしてください。",
        };
      }

      return {
        error: "確認メールの再送信に失敗しました。もう一度お試しください。",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected resend error:", err);
    return {
      error: "予期しないエラーが発生しました。もう一度お試しください。",
    };
  }
}
