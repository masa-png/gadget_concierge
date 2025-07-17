"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { recommendationApi, ApiError } from "@/lib/api-client";

interface Recommendation {
  id: string;
  rank: number;
  score: number;
  reason: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    rating: number;
    features: string;
    rakuten_url: string;
    image_url: string;
  };
}

interface ResultPageProps {
  params: {};
}

const ResultPage: React.FC<ResultPageProps> = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("セッションIDが見つかりません");
      setIsLoading(false);
      return;
    }

    // レコメンド取得
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // レコメンド結果を取得
        const response = await recommendationApi.get(sessionId);
        setRecommendations(response.data.recommendations);
      } catch (err) {
        console.error("レコメンド取得エラー:", err);
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "予期しないエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [sessionId]);

  const handleNewQuestionnaire = () => {
    router.push("/questionnaire");
  };

  const handleViewHistory = () => {
    router.push("/profile");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              結果を生成中...
            </h2>
            <p className="text-gray-500">
              あなたに最適なガジェットを分析しています
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#f5f8fc] flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <div className="space-y-4">
              <Button
                onClick={handleNewQuestionnaire}
                variant="default"
                size="lg"
                className="w-full"
              >
                新しい診断を開始
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                ホームに戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f8fc] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            あなたに最適なガジェット
          </h1>
          <p className="text-lg text-gray-600">
            診断の結果に基づいて、おすすめのガジェットをご紹介します
          </p>
        </div>

        {/* Recommendations */}
        <div className="space-y-6 mb-8">
          {recommendations.length > 0 ? (
            recommendations.map((recommendation, index) => (
              <Card key={recommendation.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="w-full md:w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    {recommendation.product.image_url ? (
                      <img
                        src={recommendation.product.image_url}
                        alt={recommendation.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">📱</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {recommendation.product.name}
                        </h3>
                        <div className="text-sm text-gray-500 mb-2">
                          マッチ度: {Math.round(recommendation.score * 100)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPrice(recommendation.product.price)}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">
                      {recommendation.product.description}
                    </p>

                    {/* Reason */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        おすすめの理由
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {recommendation.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <div className="text-gray-500 text-lg mb-4">
                診断が完了しました！
              </div>
              <p className="text-gray-700 mb-4">
                レコメンド機能は現在開発中です。しばらくお待ちください。
              </p>

              <div className="space-y-2">
                <Button
                  onClick={handleNewQuestionnaire}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  新しい診断を開始
                </Button>
                <Button
                  onClick={handleViewHistory}
                  variant="outline"
                  className="w-full"
                >
                  履歴を見る
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleNewQuestionnaire} variant="default" size="lg">
            新しい診断を開始
          </Button>
          <Button
            onClick={handleViewHistory}
            variant="outline"
            className="px-8 py-3"
          >
            履歴を見る
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="px-8 py-3"
          >
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
