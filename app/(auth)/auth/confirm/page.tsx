"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Mail,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { resendConfirmationEmail } from "./actions";

// useSearchParamsを使用するコンポーネント
function ConfirmContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const message = searchParams.get("message");
  const email = searchParams.get("email");
  const error = searchParams.get("error");

  // エラーメッセージをデコード
  const decodedError = error ? decodeURIComponent(error) : null;

  // 再送信機能
  const handleResendEmail = async () => {
    if (!email) {
      setResendStatus({
        type: "error",
        message: "メールアドレスが指定されていません。",
      });
      return;
    }

    setLoading(true);
    setResendStatus({ type: null, message: "" });

    try {
      const result = await resendConfirmationEmail(email);

      if (result?.error) {
        setResendStatus({
          type: "error",
          message: result.error,
        });
      } else {
        setResendStatus({
          type: "success",
          message: "確認メールを再送信しました。",
        });
      }
    } catch {
      setResendStatus({
        type: "error",
        message: "再送信に失敗しました。もう一度お試しください。",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            ログインページに戻る
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              {error ? (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              ) : (
                <Mail className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {decodedError ? "エラーが発生しました" : "メール確認"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {decodedError ? (
              // エラー表示
              <div className="text-center space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">
                    {decodedError === "access_denied"
                      ? "メール確認がキャンセルされました。"
                      : decodedError === "invalid_request"
                      ? "リンクが無効または期限切れです。"
                      : `メール確認中にエラーが発生しました: ${decodedError}`}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => (window.location.href = "/signup")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    新規登録をやり直す
                  </button>

                  <Link href="/login" className="block">
                    <button className="w-full">ログインページへ</button>
                  </Link>
                </div>
              </div>
            ) : (
              // 通常の確認メッセージ
              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">
                      アカウント作成完了
                    </span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    {message
                      ? decodeURIComponent(message)
                      : "メールアドレスに確認リンクを送信しました。"}
                  </p>
                </div>

                {email && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-2">送信先:</p>
                    <p className="font-medium text-gray-900 break-all">
                      {email}
                    </p>
                  </div>
                )}

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="space-y-2">
                    <p className="font-medium">次の手順:</p>
                    <ol className="list-decimal list-inside space-y-1 text-left">
                      <li>メールボックスをご確認ください</li>
                      <li>確認メール内のリンクをクリック</li>
                      <li>ログインしてサービスをお楽しみください</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-yellow-800 text-xs font-medium mb-1">
                          メールが届かない場合
                        </p>
                        <ul className="text-yellow-700 text-xs space-y-1">
                          <li>• 迷惑メールフォルダをご確認ください</li>
                          <li>• 数分お待ちください</li>
                          <li>• 下記から再送信できます</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 再送信機能 */}
                {email && (
                  <div className="space-y-3">
                    {resendStatus.type && (
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          resendStatus.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {resendStatus.message}
                      </div>
                    )}

                    <button
                      onClick={handleResendEmail}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          送信中...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          確認メールを再送信
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Link href="/login">
                    <button className="w-full">ログインページへ</button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// メインコンポーネント
export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  読み込み中...
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">ページを読み込んでいます</p>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
