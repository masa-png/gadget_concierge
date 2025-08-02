import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

export function ContactInfo() {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle>よくあるご質問</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">サービスは無料ですか？</h4>
          <p className="text-sm text-gray-600">
            基本的なガジェット診断・推奨機能は無料でご利用いただけます。
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">
            推奨された製品を購入する必要はありますか？
          </h4>
          <p className="text-sm text-gray-600">
            いいえ、推奨は参考情報です。購入は任意です。
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">個人情報の取り扱いは？</h4>
          <p className="text-sm text-gray-600">
            プライバシーポリシーに従い、適切に管理いたします。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}