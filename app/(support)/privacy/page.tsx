import { Card, CardContent } from "@/app/_components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            ホームに戻る
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              プライバシーポリシー
            </h1>
            <p className="text-lg text-gray-600">最終更新日：2025年8月1日</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">1. 基本方針</h2>
              <p className="mb-4">
                ガジェットコンシェルジュ（以下「当サイト」といいます。）は、ユーザーの個人情報の保護を重要な責務と考え、個人情報の取扱いについて以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">2. 収集する情報</h2>
              <p className="mb-4">
                当サイトでは、サービスを提供するために以下の情報を収集する場合があります。
              </p>

              <h3 className="text-lg font-semibold mb-3">
                2.1 ユーザーが提供する情報
              </h3>
              <ul className="list-disc pl-6 mb-4">
                <li>ガジェット診断における回答内容</li>
                <li>お問い合わせ内容（メールアドレスを含む）</li>
                <li>その他ユーザーが任意で入力する情報</li>
              </ul>

              <h3 className="text-lg font-semibold mb-3">
                2.2 自動的に収集される情報
              </h3>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  アクセスログ（IPアドレス、ブラウザ情報、アクセス日時等）
                </li>
                <li>サイト利用状況（ページビュー、滞在時間等）</li>
                <li>Cookie及び類似技術による情報（Googleアナリティクス等）</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">3. 利用目的</h2>
              <p className="mb-4">収集した情報は以下の目的で利用します。</p>
              <ul className="list-disc pl-6 mb-4">
                <li>ガジェット診断サービスの提供</li>
                <li>お問い合わせへの対応</li>
                <li>サイトの利用状況の分析・改善</li>
                <li>重要なお知らせの連絡</li>
                <li>不正利用の防止</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">4. 第三者への提供</h2>
              <p className="mb-4">
                当サイトは、以下の場合を除き、個人情報を第三者に提供することはありません。
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>ユーザーの同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>
                  人の生命・身体・財産の保護のために必要で、同意を得ることが困難な場合
                </li>
              </ul>

              <h3 className="text-lg font-semibold mb-3 mt-6">
                4.1 外部サービスの利用
              </h3>
              <p className="mb-4">
                当サイトでは以下の外部サービスを利用しており、これらのサービスにおいて情報が収集される場合があります。
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Google Analytics（アクセス解析）</li>
                <li>その他の解析ツール</li>
              </ul>
              <p className="mb-4">
                これらのサービスの利用については、各サービスのプライバシーポリシーをご確認ください。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">5. データの管理・保護</h2>
              <p className="mb-4">
                個人情報の保護のため、以下の対策を実施しています。
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>SSL/TLS暗号化通信の使用</li>
                <li>適切なアクセス制御</li>
                <li>定期的なセキュリティ対策の見直し</li>
                <li>不要になった個人情報の適切な削除</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                6. Cookie（クッキー）について
              </h2>
              <p className="mb-4">
                当サイトでは、サービスの利便性向上やアクセス解析のためにCookieを使用しています。Cookieの使用を希望しない場合は、ブラウザの設定で無効にすることができますが、一部機能が制限される場合があります。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                7. 個人情報の開示・訂正・削除
              </h2>
              <p className="mb-4">
                ユーザーは、自己の個人情報について開示・訂正・削除を求めることができます。ご希望の場合は、お問い合わせフォームよりご連絡ください。合理的な期間内に対応いたします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">8. お問い合わせ</h2>
              <p className="mb-4">
                本プライバシーポリシーに関するお問い合わせは、サイト内のお問い合わせフォームよりご連絡ください。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                9. プライバシーポリシーの変更
              </h2>
              <p className="mb-4">
                本ポリシーは、必要に応じて変更することがあります。重要な変更については、サイト上で事前にお知らせします。変更後のプライバシーポリシーは、本サイトに掲載した時点から効力を生じます。
              </p>
            </section>

            <div className="text-center mt-8 pt-8 border-t">
              <p className="text-gray-600">以上</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
