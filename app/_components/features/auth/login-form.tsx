"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import {
  FormField,
  PasswordField,
  ErrorMessage,
  LoadingButton,
} from "@/app/_components/ui/form";
import { Mail } from "lucide-react";
import { login } from "@/lib/actions/auth";
import { useAuth } from "@/app/_components/shared/providers/auth-provider";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // FormDataを作成
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      // サーバーアクションを実行
      const result = await login(formData);

      if (result?.error) {
        setError(result.error);
      } else {
        // ログイン成功時
        await refreshAuth(); // 認証状態を更新
      }
    } catch {
      setError("ログインに失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <ErrorMessage message={error} />}

      <FormField
        name="email"
        label="メールアドレス"
        type="email"
        placeholder="your@email.com"
        icon={Mail}
        error={errors.email?.message}
        disabled={isLoading}
        register={register}
        required
      />

      <PasswordField
        name="password"
        label="パスワード"
        placeholder="パスワードを入力"
        error={errors.password?.message}
        disabled={isLoading}
        register={register}
        required
      />

      <div className="flex justify-end">
        <a
          href="/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          パスワードを忘れた方
        </a>
      </div>

      <LoadingButton
        type="submit"
        isLoading={isLoading}
        loadingText="ログイン中..."
        className="w-full"
        size="lg"
      >
        ログイン
      </LoadingButton>
    </form>
  );
}
