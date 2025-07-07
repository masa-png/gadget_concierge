"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signup } from "@/lib/actions/auth";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("email", data.email);
      fd.append("password", data.password);
      fd.append("name", data.name);

      const result = await signup(fd);

      // エラーがある場合の処理
      if (result?.error) {
        setServerError(result.error);
        return;
      }

      // 成功時の処理（redirectが発生しない場合）
      // 通常はredirectするため、ここは実行されない
    } catch (e: any) {
      console.error("Signup error:", e);

      // NEXT_REDIRECTエラーは正常な動作なので無視
      if (e?.message?.includes("NEXT_REDIRECT")) {
        console.log("Redirect triggered - this is expected behavior");
        return;
      }

      // その他の実際のエラーの場合
      if (e?.message) {
        setServerError(`サインアップ中にエラーが発生しました: ${e.message}`);
      } else {
        setServerError(
          "サインアップ中にエラーが発生しました。もう一度お試しください。"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            ホームに戻る
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              新規登録
            </CardTitle>
            <p className="text-gray-600">アカウントを作成してサービスを開始</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  お名前
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    {...register("name")}
                    type="text"
                    placeholder="山田太郎"
                    className="pl-10"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    {...register("email")}
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="8文字以上のパスワード"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  パスワード確認
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="パスワードを再入力"
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    {...register("termsAccepted")}
                    className="mt-1 rounded border-gray-300"
                    disabled={loading}
                  />
                  <label
                    htmlFor="termsAccepted"
                    className="text-sm text-gray-600"
                  >
                    <Link
                      href="/terms"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      利用規約
                    </Link>
                    および
                    <Link
                      href="/privacy"
                      className="text-blue-600 hover:text-blue-700 underline ml-1"
                    >
                      プライバシーポリシー
                    </Link>
                    に同意します
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-red-500 text-xs">
                    {errors.termsAccepted.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl py-2 text-lg font-semibold text-white shadow-md hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "登録中..." : "アカウントを作成"}
              </button>
            </form>

            <div className="relative">
              <div className="w-full h-px bg-gray-200" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                または
              </span>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2 text-base font-semibold text-black bg-white hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                <svg
                  className="mr-2 h-5 w-5"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <path
                      fill="#4285F4"
                      d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.13 2.13 30.45 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.21C12.36 13.13 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#34A853"
                      d="M46.1 24.55c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.13 46.1 31.36 46.1 24.55z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.67 28.65A14.5 14.5 0 019.5 24c0-1.62.28-3.19.77-4.65l-7.98-6.21A23.97 23.97 0 000 24c0 3.97.96 7.73 2.69 11.01l7.98-6.21z"
                    />
                    <path
                      fill="#EA4335"
                      d="M24 48c6.45 0 12.13-2.13 16.69-5.84l-7.19-5.6c-2.01 1.35-4.57 2.14-7.5 2.14-6.26 0-11.64-3.63-14.33-8.94l-7.98 6.21C6.73 42.52 14.82 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </g>
                </svg>
                Googleでログイン
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                すでにアカウントをお持ちの方は{" "}
              </span>
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ログイン
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
