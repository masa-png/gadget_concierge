import { Card, CardContent } from "@/app/_components/ui/card";
import { MessageSquare, Cpu, ShoppingCart } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "質問に答える",
    description: "システムが生成する質問に答えて、あなたのニーズを明確にします",
    step: "01",
  },
  {
    icon: Cpu,
    title: "データ分析",
    description: "あなたの回答を分析し、最適なガジェットを選定します",
    step: "02",
  },
  {
    icon: ShoppingCart,
    title: "製品提案",
    description: "厳選されたガジェットと詳細な推奨理由をお届けします",
    step: "03",
  },
];

export function HowItWorks() {
  return (
    <section className="px-4 py-20 bg-white/40">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 md:text-4xl mb-4">
            簡単3ステップ
          </h2>
          <p className="text-lg text-gray-600">
            わずか数分で、あなたにぴったりのガジェットが見つかります
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="relative border-0 bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardContent className="p-8 text-center">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                  <step.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
