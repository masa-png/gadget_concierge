---
inclusion: always
---

## 開発ガイドライン

### 言語とコミュニケーション

- **必須**: コメント、ドキュメント、仕様書は日本語で記述
- **必須**: JSDoc は日本語で関数の目的・引数・戻り値を明記
- **パターン**: 変数名・関数名は英語、説明文は日本語

### TypeScript 厳格ルール

- **禁止**: `any` 型の使用 → `unknown` または適切な型定義を使用
- **必須**: 関数の戻り値型を明示的に指定
- **必須**: Zod スキーマから型推論 `z.infer<typeof schema>`
- **必須**: strict モード維持、型エラーは即座に解決

### アーキテクチャパターン

#### ファイル配置規則

- `app/api/` - 外部 API 統合のみ、ビジネスロジックは `lib/services/` に配置
- `lib/actions/` - Server Actions（データ変更操作）
- `app/_components/features/[domain]/` - ドメイン駆動設計でコンポーネント整理
- `lib/types/` - Prisma 生成型優先、手動定義は最小限
- `lib/validations/` - Zod スキーマ定義

#### コンポーネント設計

- **デフォルト**: Server Components
- **例外**: `'use client'` はインタラクション必須時のみ
- **必須**: `cn()` で Tailwind クラス結合
- **パターン**: shadcn/ui コンポーネント規約に準拠

### データ層とセキュリティ

- **必須**: Prisma 経由でのみ DB 操作
- **必須**: 入力値は Zod で事前検証
- **必須**: Supabase RLS でアクセス制御
- **禁止**: `.env` 直接操作 → `.env.example` 参照
- **必須**: 機密情報は環境変数で管理

### 状態管理とデータフェッチ

- **必須**: SWR でデータフェッチ・キャッシュ管理
- **パフォーマンス**: `useCallback`/`useMemo` で不要な再レンダリング防止
- **必須**: N+1 問題回避のため Prisma `include`/`select` 適切使用

### エラーハンドリング戦略

- **必須**: `lib/errors/` カスタムエラークラス使用
- **必須**: API は構造化エラーレスポンス返却
- **必須**: ユーザー向けメッセージは日本語
- **UI**: Sonner トーストでフィードバック提供

### AI 推奨システム固有ルール

- **必須**: Mastra フレームワーク経由で AI 操作
- **必須**: プロンプト生成は `lib/services/prompt-generator.ts` 使用
- **必須**: AI レスポンス解析は `lib/services/ai-response-analyzer.ts` 使用
- **必須**: 商品マッピングは `lib/services/product-mapper.ts` 使用
