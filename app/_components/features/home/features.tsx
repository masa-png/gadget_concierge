import { Card, CardContent } from "@/app/_components/ui/card";
import { Brain, Search, Shield, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "スマート質問システム",
    description:
      "あなたの潜在的なニーズを引き出し、最適なガジェットを見つけるための質問を自動生成します。",
  },
  {
    icon: Search,
    title: "パーソナライズ検索",
    description:
      "用途、予算、好みに基づいて、数千の製品から最適な選択肢を瞬時に絞り込みます。",
  },
  {
    icon: Shield,
    title: "信頼性の高い情報",
    description:
      "専門用語を分かりやすく解説し、購入失敗のリスクを最小限に抑えます。",
  },
  {
    icon: TrendingUp,
    title: "トレンド予測",
    description:
      "最新の市場動向を分析し、将来性のあるガジェット選びをサポートします。",
  },
];

export function Features() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl mb-4">
            なぜガジェットコンシェルジュなのか
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            最新技術を活用して、あなたのガジェット選びを革新的にサポートします
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
