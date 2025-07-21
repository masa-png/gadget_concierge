import { Button } from "@/app/_components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            スマートガジェット選択支援サービス
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ガジェット
            </span>
            <br />
            コンシェルジュ
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 md:text-xl">
            「分からない」を「見つかる」に変える、あなただけのガジェット選びコンシェルジュ。
            最新技術があなたのニーズを深く理解し、最適なガジェットを提案します。
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/questionnaire">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                ガジェット診断を始める
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                カテゴリから探す
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
