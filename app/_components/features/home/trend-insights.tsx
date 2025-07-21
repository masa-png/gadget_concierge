"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { TrendingUp, Users, Lightbulb } from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const chartData = {
  labels: ["レビューサイト", "SNS", "友人・知人", "メーカー公式", "その他"],
  datasets: [
    {
      data: [35, 25, 20, 15, 5],
      backgroundColor: ["#3B82F6", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"],
      borderWidth: 0,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        padding: 20,
        usePointStyle: true,
      },
    },
  },
};

export function TrendInsights() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl mb-4">
            ガジェット市場インサイト
          </h2>
          <p className="text-lg text-gray-600">
            最新のトレンドと消費者行動を分析
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                情報収集源
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                トレンド予測
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  急速充電技術
                </h4>
                <p className="text-sm text-blue-700">
                  GaN充電器の普及により、小型・高出力化が加速
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">
                  ワイヤレス化
                </h4>
                <p className="text-sm text-purple-700">
                  完全ワイヤレスイヤホンの音質向上とバッテリー持続時間の延長
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                購入失敗要因
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">スペック理解不足</span>
                  <span className="text-sm font-semibold text-red-600">
                    42%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">互換性確認不足</span>
                  <span className="text-sm font-semibold text-red-600">
                    28%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">用途とのミスマッチ</span>
                  <span className="text-sm font-semibold text-red-600">
                    23%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">価格重視の選択</span>
                  <span className="text-sm font-semibold text-red-600">7%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
