import { Card, CardContent } from "@/app/_components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">利用規約</h1>
            <p className="text-lg text-gray-600">最終更新日：2025年8月1日</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第1条（適用）</h2>
              <p className="mb-4">
                本利用規約（以下「本規約」といいます。）は、ガジェットコンシェルジュ（以下「当サイト」といいます。）が提供するガジェット診断サービス（以下「本サービス」といいます。）の利用条件を定めるものです。本サービスをご利用いただく際は、本規約にご同意いただいたものとみなします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第2条（サービス内容）</h2>
              <p className="mb-4">
                本サービスは、ユーザーの回答に基づいてガジェットの選択をサポートする無料の診断サービスです。診断結果は参考情報として提供されるものであり、購入を保証するものではありません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第3条（会員登録）</h2>
              <p className="mb-4">
                ガジェット診断機能をご利用いただくには、会員登録が必要です。登録時に必要な情報を正確に入力してください。
              </p>
              <p className="mb-4">
                未成年の方は保護者の同意を得てご利用ください。
              </p>
              <p className="mb-4">
                以下に該当する場合、登録をお断りすることがあります：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>虚偽の情報で登録しようとする場合</li>
                <li>過去に利用規約に違反した場合</li>
                <li>その他、適切でないと判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                第4条（アカウント管理）
              </h2>
              <p className="mb-4">
                ユーザーは登録した認証情報（メールアドレス、パスワード等）を適切に管理し、第三者に譲渡・貸与・共用してはなりません。
              </p>
              <p className="mb-4">
                認証情報による本サービスの利用は、登録したユーザー本人による利用とみなします。認証情報の管理不十分により生じた損害について、当サイトは責任を負いません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第5条（禁止事項）</h2>
              <p className="mb-4">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>法令に違反する行為</li>
                <li>当サイトのサーバーやシステムに過度な負荷をかける行為</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>不正なアクセスを試みる行為</li>
                <li>複数のアカウントを不正に作成する行為</li>
                <li>他人になりすましてアカウントを作成する行為</li>
                <li>他のユーザーや第三者に迷惑をかける行為</li>
                <li>本サービスの内容を無断で商用利用する行為</li>
                <li>その他、当サイトが不適切と判断する行為</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第6条（知的財産権）</h2>
              <p className="mb-4">
                本サービスに含まれるコンテンツ（文章、画像、診断ロジック等）の著作権は当サイトに帰属します。無断での複製、転載、配布は禁止します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                第7条（サービスの変更・停止）
              </h2>
              <p className="mb-4">
                当サイトは、以下の場合にサービスの全部または一部を変更・停止することがあります。
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>システムメンテナンスを行う場合</li>
                <li>技術的障害が発生した場合</li>
                <li>天災等の不可抗力による場合</li>
                <li>その他、運営上必要と判断した場合</li>
              </ul>
              <p className="mb-4">
                これらの場合、可能な限り事前にお知らせしますが、緊急時はこの限りではありません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">
                第8条（アカウントの停止・削除）
              </h2>
              <p className="mb-4">
                以下の場合、事前通知なくアカウントを停止または削除することがあります：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>利用規約に違反した場合</li>
                <li>長期間ご利用がない場合</li>
                <li>その他、運営上必要と判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第9条（免責事項）</h2>
              <p className="mb-4">
                当サイトは、本サービスに関して以下の点についてご了承ください。
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>診断結果の正確性や完全性を保証するものではありません</li>
                <li>
                  診断結果に基づく購入や利用による損害について責任を負いません
                </li>
                <li>
                  サービス利用により生じた損害について、法令に反しない範囲で責任を制限します
                </li>
                <li>
                  外部サイトへのリンクについて、その内容に責任を負いません
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第10条（プライバシー）</h2>
              <p className="mb-4">
                個人情報の取扱いについては、別途定める「プライバシーポリシー」に従います。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第11条（規約の変更）</h2>
              <p className="mb-4">
                本規約は必要に応じて変更する場合があります。重要な変更については、サイト上でお知らせします。変更後も本サービスをご利用いただいた場合、変更に同意したものとみなします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第12条（お問い合わせ）</h2>
              <p className="mb-4">
                本規約や本サービスについてご質問がある場合は、サイト内のお問い合わせフォームよりご連絡ください。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">第13条（準拠法）</h2>
              <p className="mb-4">
                本規約は日本法に準拠し、日本法に従って解釈されます。
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
