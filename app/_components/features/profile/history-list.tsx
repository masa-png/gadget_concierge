"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { Clock, Eye, Play } from "lucide-react";
import useHistory from "@/hooks/use-history";
import { formatToJapanTime } from "@/lib/utils/date";

const HistoryList: React.FC = () => {
  const router = useRouter();
  const { history, isLoading, error, refetch } = useHistory();

  const formatDate = (dateString: string) => {
    return formatToJapanTime(dateString);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">完了</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">進行中</Badge>;
      case "abandoned":
        return <Badge className="bg-gray-100 text-gray-800">中断</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewResult = (sessionId: string) => {
    router.push(`/recommendations/result?sessionId=${sessionId}`);
  };

  const handleResume = (sessionId: string) => {
    router.push(`/questionnaire?sessionId=${sessionId}`);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">履歴を読み込み中...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            エラーが発生しました
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            再読み込み
          </Button>
        </div>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            診断履歴がありません
          </h3>
          <p className="text-gray-500 mb-6">
            最初の診断を開始して、ガジェットをお探しください
          </p>
          <Button
            onClick={() => router.push("/questionnaire")}
            variant="default"
          >
            診断を開始
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">診断履歴</h2>
        <Button onClick={refetch} variant="outline" size="sm">
          更新
        </Button>
      </div>

      <div className="space-y-4">
        {history?.map((item) => (
          <Card key={item.sessionId} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.categoryName}
                  </h3>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>

                {/* レコメンド結果の表示 */}
                {item.recommendations && item.recommendations.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      おすすめガジェット:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {item.recommendations.slice(0, 3).map((rec) => (
                        <Badge
                          key={rec.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {rec.name} ({Math.round(rec.score * 100)}%)
                        </Badge>
                      ))}
                      {item.recommendations.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.recommendations.length - 3}件
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {item.status === "completed" && (
                  <Button
                    onClick={() => handleViewResult(item.sessionId)}
                    size="sm"
                    variant="default"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    結果を見る
                  </Button>
                )}

                {item.status === "in_progress" && (
                  <Button
                    onClick={() => handleResume(item.sessionId)}
                    size="sm"
                    variant="default"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    続きを始める
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
