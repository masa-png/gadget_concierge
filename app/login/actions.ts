// app/login/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { loginSchema, signupServerSchema } from "@/lib/validations/auth";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // FormDataを通常のオブジェクトに変換
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Zodでバリデーション
  const validationResult = loginSchema.safeParse(rawData);

  if (!validationResult.success) {
    const firstError = validationResult.error.errors[0];
    return { error: firstError.message };
  }

  const data = validationResult.data;
  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("Login error:", error);

    // より具体的なエラーメッセージ
    if (error.message.includes("Invalid login credentials")) {
      return { error: "メールアドレスまたはパスワードが正しくありません。" };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        error:
          "メールアドレスの確認が完了していません。メールをご確認ください。",
      };
    }

    return { error: "ログインに失敗しました。もう一度お試しください。" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // FormDataを通常のオブジェクトに変換
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  console.log("Raw form data:", rawData); // デバッグ用

  // Zodでバリデーション
  const validationResult = signupServerSchema.safeParse(rawData);

  if (!validationResult.success) {
    console.log("Validation error:", validationResult.error); // デバッグ用
    const firstError = validationResult.error.errors[0];
    return { error: firstError.message };
  }

  const data = validationResult.data;
  console.log("Validated data:", data); // デバッグ用

  console.log("Attempting to sign up user..."); // デバッグ用

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  console.log("Supabase response:", { authData, error }); // デバッグ用

  if (error) {
    console.error("Signup error:", error);

    // より具体的なエラーメッセージ
    if (error.message.includes("User already registered")) {
      return { error: "このメールアドレスは既に登録されています。" };
    }
    if (error.message.includes("Password should be")) {
      return {
        error:
          "パスワードの要件を満たしていません。8文字以上で入力してください。",
      };
    }
    if (error.message.includes("Invalid email")) {
      return { error: "有効なメールアドレスを入力してください。" };
    }

    return {
      error: `アカウントの作成に失敗しました: ${error.message}`,
    };
  }

  // アカウント作成は成功したが、メール確認が必要な場合
  if (authData.user && !authData.session) {
    console.log("Email confirmation required"); // デバッグ用
    // メール確認が必要な場合、確認ページにリダイレクト
    const email = encodeURIComponent(data.email);
    redirect(`/auth/confirm?email=${email}`);
  }

  // 即座にログイン状態になる場合（メール確認不要の設定の場合）
  console.log("Auto login successful"); // デバッグ用
  revalidatePath("/", "layout");
  redirect("/");
}

// Google OAuth用の関数（必要に応じて実装）
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google sign-in error:", error);
    return { error: "Googleログインに失敗しました。" };
  }

  if (data.url) {
    redirect(data.url);
  }
}
