"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { MessageSquare, Sparkles, TrendingUp, Award } from "lucide-react";

interface ProfileStats {
  questionCount: number;
  recommendationCount: number;
  totalQuestions?: number;
  averageQuestionsPerDay?: number;
}

interface ProfileStatsProps {
  stats: ProfileStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const statItems = [
    {
      title: "総質問数",
      value: stats.questionCount,
      icon: MessageSquare,
      description: "これまでにした質問の総数",
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      gradient: "from-blue-500 to-blue-600",
      cardGradient: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
    },
    {
      title: "総推奨数",
      value: stats.recommendationCount,
      icon: Sparkles,
      description: "受け取った推奨の総数",
      color: "text-purple-600",
      bgColor: "bg-purple-500",
      gradient: "from-purple-500 to-purple-600",
      cardGradient: "from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
    },
    {
      title: "平均質問数",
      value: stats.averageQuestionsPerDay || 0,
      icon: TrendingUp,
      description: "1日あたりの平均質問数",
      color: "text-green-600",
      bgColor: "bg-green-500",
      gradient: "from-green-500 to-green-600",
      cardGradient: "from-green-50 to-green-100",
      borderColor: "border-green-200",
    },
    {
      title: "アクティブ度",
      value: stats.questionCount > 0 ? "高" : "低",
      icon: Award,
      description: "アプリの利用頻度",
      color: "text-orange-600",
      bgColor: "bg-orange-500",
      gradient: "from-orange-500 to-orange-600",
      cardGradient: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card
          key={index}
          className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <CardHeader
            className={`bg-gradient-to-r ${item.cardGradient} ${item.borderColor} border-b pb-4`}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {item.title}
              </CardTitle>
              <div
                className={`p-2 rounded-lg bg-gradient-to-r ${item.gradient} shadow-md`}
              >
                <item.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {item.description}
            </p>

            {/* 進捗バー（質問数と推奨数にのみ表示） */}
            {index < 2 && typeof item.value === "number" && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>進捗</span>
                  <span>{Math.min(item.value, 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${item.gradient} transition-all duration-500`}
                    style={{ width: `${Math.min(item.value, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
