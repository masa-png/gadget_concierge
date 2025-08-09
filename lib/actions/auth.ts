"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { loginSchema, signupServerSchema } from "@/lib/validations/auth";
import { createInitialProfile } from "@/lib/actions/profile";

// エラーメッセージの日本語化
function getLocalizedErrorMessage(error: unknown): string {
  const message = typeof error === 'string' ? error : 
    (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : "不明なエラーが発生しました");

  // Supabase のエラーメッセージを日本語に変換
  if (message.includes("Invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません";
  }
  if (message.includes("Email not confirmed")) {
    return "メールアドレスの確認が完了していません";
  }
  if (message.includes("User already registered")) {
    return "このメールアドレスは既に登録されています";
  }
  if (message.includes("Password should be at least")) {
    return "パスワードは6文字以上で入力してください";
  }
  if (message.includes("Invalid email")) {
    return "正しいメールアドレスを入力してください";
  }
  if (message.includes("weak password")) {
    return "パスワードが弱すぎます。より強力なパスワードを入力してください";
  }

  return message;
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validationResult = loginSchema.safeParse({ email, password });
  if (!validationResult.success) {
    return {
      error:
        validationResult.error.errors[0]?.message || "入力値が正しくありません",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: getLocalizedErrorMessage(error),
    };
  }

  // セッションを確実に設定
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // プロフィールが存在しない場合は自動作成
    try {
      await createInitialProfile();
    } catch (profileError) {
      console.error("プロフィール自動作成エラー:", profileError);
      // プロフィール作成に失敗してもログインは成功とする
    }

    revalidatePath("/", "layout");
    redirect("/");
  } else {
    return {
      error: "セッションの作成に失敗しました",
    };
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // FormData から値を取得
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  // バリデーション
  const validationResult = signupServerSchema.safeParse({
    email,
    password,
    name,
  });

  if (!validationResult.success) {
    return {
      error:
        validationResult.error.errors[0]?.message || "入力値が正しくありません",
    };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return {
      error: getLocalizedErrorMessage(error),
    };
  }

  revalidatePath("/", "layout");
  redirect("/auth/confirm");
}
