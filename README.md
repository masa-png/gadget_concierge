# Supabase サインアップ エラー トラブルシューティング

## 1. 環境変数の確認

`.env.local` ファイルが正しく設定されているか確認してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 2. Supabase クライアント設定の確認

`utils/supabase/server.ts` が正しく設定されているか確認：

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component内での実行時は無視
          }
        },
      },
    }
  );
}
```

## 3. Supabase プロジェクト設定

### 認証設定を確認：

1. Supabase Dashboard → Authentication → Settings
2. "Enable email confirmations" の設定を確認
3. "Site URL" が正しく設定されているか確認 (`http://localhost:3000`)

### メール設定を確認：

1. Authentication → Settings → Email Templates
2. メール送信が有効になっているか確認

## 4. 一般的なエラーと解決方法

### "Invalid JWT" エラー

- 環境変数が正しく設定されているか確認
- Supabase プロジェクトが有効かどうか確認

### "User already registered" エラー

- 既に登録済みのメールアドレスを使用している
- Supabase Dashboard で確認可能

### "Password should be at least 6 characters" エラー

- Supabase のパスワードポリシー設定を確認
- Authentication → Settings → Password Policy

### "Invalid email" エラー

- メールアドレスの形式を確認
- 特殊文字が含まれていないか確認

## 5. デバッグ手順

1. **ブラウザのコンソールログを確認**

   - F12 → Console タブ
   - エラーメッセージの詳細を確認

2. **サーバーログを確認**

   - `npm run dev` のターミナル出力
   - デバッグログを確認

3. **Supabase ログを確認**
   - Supabase Dashboard → Logs
   - API エラーの詳細を確認

## 6. チェックリスト

- [ ] 環境変数が正しく設定されている
- [ ] Supabase クライアントが正しく初期化されている
- [ ] Supabase プロジェクトが有効
- [ ] 認証設定が適切
- [ ] メール設定が有効
- [ ] フォームデータが正しく送信されている
- [ ] ネットワーク接続が正常

## 7. よくある設定ミス

1. **環境変数名の間違い**
   - `NEXT_PUBLIC_` プレフィックスが必要
2. **URL の末尾スラッシュ**
   - Supabase URL の末尾に `/` がないか確認
3. **開発環境と本番環境の設定混在**
   - 正しい環境の設定を使用しているか確認
