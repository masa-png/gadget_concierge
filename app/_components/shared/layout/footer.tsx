import { Sparkles, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  service: [
    { href: "/questionnaire", label: "ガジェット診断" },
    { href: "/categories", label: "カテゴリ検索" },
    { href: "/recommendations", label: "おすすめ製品" },
  ],
  analysis: [
    { href: "/profile", label: "プロフィール" },
    { href: "/profile/history", label: "利用履歴" },
  ],
  support: [
    { href: "/contact", label: "お問い合わせ" },
    { href: "/terms", label: "利用規約" },
    { href: "/privacy", label: "プライバシーポリシー" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* CTA セクション */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-8">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2">
            今すぐガジェット診断を始めませんか？
          </h3>
          <p className="text-blue-100 mb-4">
            探す時間を、楽しむ時間に。スマートなガジェット選びを!
          </p>
          <Link href="/questionnaire">
            <button className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border border-transparent hover:border-blue-200">
              <MessageSquare className="mr-2 h-4 w-4" />
              診断を開始
            </button>
          </Link>
        </div>
      </div>

      {/* メインフッターコンテンツ */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* ブランド情報 */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                ガジェットコンシェルジュ
              </span>
            </Link>
            <p className="text-gray-300 mb-6 max-w-md">
              「分からない」を「見つかる」に変える、あなただけのガジェット選びコンシェルジュ。
            </p>
          </div>

          {/* サービス */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              サービス
            </h3>
            <ul className="space-y-2">
              {footerLinks.service?.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              )) || null}
            </ul>
          </div>

          {/* マイページ */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              マイページ
            </h3>
            <ul className="space-y-2">
              {footerLinks.analysis?.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              )) || null}
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="font-semibold mb-4">サポート</h3>
            <ul className="space-y-2 mb-6">
              {footerLinks.support?.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              )) || null}
            </ul>
          </div>
        </div>

        <div className="my-4 h-px bg-gray-700" />

        {/* コピーライト */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div
            className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0
                          md:space-x-6 text-sm text-gray-400"
          >
            <p>&copy; 2025 ガジェットコンシェルジュ. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
