import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ContactForm } from "./_components/ContactForm";
import { ContactInfo } from "./_components/ContactInfo";

export default function ContactPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
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
              お問い合わせ
            </h1>
            <p className="text-lg text-gray-600">
              ご質問やご要望がございましたら、お気軽にお問い合わせください
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          <div className="space-y-6">
            <ContactInfo />
          </div>
        </div>
      </div>
    </div>
  );
}
