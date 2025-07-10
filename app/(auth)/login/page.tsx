"use client";

import React from "react";
import { LoginForm } from "@/app/_components/features/auth/login-form";
import { SocialLogin } from "@/app/_components/features/auth/social-login";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 flex items-center justify-center">
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
              ログイン
            </CardTitle>
            <p className="text-gray-600">アカウントにサインインしてください</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <LoginForm />
            <SocialLogin />

            <div className="text-center">
              <span className="text-sm text-gray-600">
                アカウントをお持ちでない方は{" "}
              </span>
              <Link
                href="/signup"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                新規登録
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
