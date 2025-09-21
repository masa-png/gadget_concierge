# エラーハンドリングとログ機能の実装

## 概要

タスク 8「エラーハンドリングとログ機能の実装」として、包括的なエラーハンドリングシステムと構造化ログ・モニタリング機能を実装しました。

## 実装内容

### 8.1 包括的なエラーハンドリングシステム

#### 実装ファイル

- `lib/services/error-handler.ts` - メインのエラーハンドリングシステム
- `lib/services/__tests__/error-handler.test.ts` - テストファイル

#### 主な機能

1. **エラー分類システム**

   - バリデーション、外部サービス、データベース、マッピングエラーの自動分類
   - 適切な HTTP ステータスコードの自動決定
   - リトライ可能性と一時的エラーの判定

2. **エラー分類カテゴリ**

   ```typescript
   enum ErrorCategory {
     VALIDATION = "VALIDATION",
     EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
     DATABASE = "DATABASE",
     MAPPING = "MAPPING",
     AUTHENTICATION = "AUTHENTICATION",
     AUTHORIZATION = "AUTHORIZATION",
     RATE_LIMIT = "RATE_LIMIT",
     NETWORK = "NETWORK",
     CONFIGURATION = "CONFIGURATION",
     UNKNOWN = "UNKNOWN",
   }
   ```

3. **対応エラータイプ**

   - AIRecommendationError
   - Zod バリデーションエラー
   - Prisma データベースエラー
   - HTTP エラー（401, 403, 429, 502, 503, 504 など）
   - ネットワークエラー（fetch 失敗、AbortError など）
   - 一般的な Error オブジェクト

4. **ユーザーフレンドリーなメッセージ**
   - 技術的なエラーを分かりやすい日本語メッセージに変換
   - エラーコードに基づく適切なユーザー向けガイダンス

### 8.2 構造化ログとモニタリング機能

#### 実装ファイル

- `lib/services/logger.ts` - 構造化ログとモニタリングシステム
- `lib/services/__tests__/logger.test.ts` - テストファイル
- `lib/services/__tests__/error-logging-integration.test.ts` - 統合テスト

#### 主な機能

1. **構造化ログシステム**

   ```typescript
   interface StructuredLogEntry {
     level: LogLevel;
     message: string;
     context: BaseLogContext;
     metrics?: PerformanceMetrics;
     error?: ErrorLogDetails;
     extra?: Record<string, unknown>;
     timestamp: string;
   }
   ```

2. **パフォーマンストラッキング**

   - AI リクエスト時間の測定
   - 商品マッピング時間の測定
   - データベース保存時間の測定
   - メモリ使用量の記録
   - DB クエリ数の追跡

3. **AI レコメンド専用ロガー**

   - レコメンド生成フロー全体のログ記録
   - セッション ID、ユーザーコンテキストの自動記録
   - エラー詳細とスタックトレースの構造化記録

4. **モニタリングサービス**
   - 成功/失敗リクエストの統計
   - 平均レスポンス時間の計算
   - エラーカテゴリ別・コード別の集計
   - アラート条件の自動検出
     - 高エラー率（50%以上）
     - 遅いレスポンス（30 秒以上）
     - AI サービス問題（25 秒以上）

## 要件対応

### 要件 2.1, 2.2, 2.3, 2.5 - エラーハンドリング

- ✅ バリデーション、外部サービス、データベース、マッピングエラーの分類処理
- ✅ 適切な HTTP ステータスコードとエラーメッセージの返却
- ✅ Mastra AI サービス利用不可時の適切なエラー処理
- ✅ AI レスポンス無効時のエラー処理とログ記録
- ✅ Prisma トランザクション失敗時のロールバック対応

### 要件 6.1, 6.2, 6.3, 6.4, 6.5 - ログとモニタリング

- ✅ セッション ID とユーザーコンテキストのログ記録
- ✅ AI リクエスト詳細とレスポンス時間のログ記録
- ✅ エラー詳細とスタックトレースの記録
- ✅ 正常生成時の件数と基本メタデータ記録
- ✅ 監査目的でのトランザクション詳細ログ記録

## 統合

### API エンドポイントとの統合

`app/api/recommendations/generate/route.ts` を更新して新しいエラーハンドリングとログシステムを統合：

1. **構造化ログの使用**

   - 従来の console.log を構造化ログに置き換え
   - パフォーマンストラッキングの自動化
   - エラーログの詳細化

2. **統一エラーハンドリング**

   - 新しい ErrorHandler クラスの使用
   - 自動的なエラー分類とレスポンス生成
   - モニタリング統計の自動更新

3. **フォールバック機能**
   - ログシステムが利用できない場合のコンソールログフォールバック
   - 循環依存を回避する動的インポート

## テスト

### テストカバレッジ

- エラー分類の網羅的テスト（29 テスト）
- ログ機能の詳細テスト（32 テスト）
- 統合テスト（5 テスト）
- 合計 66 テスト、すべて成功

### テスト内容

1. **エラー分類テスト**

   - 各エラータイプの正しい分類
   - HTTP ステータスコードの適切な決定
   - リトライ可能性と一時的エラーの判定

2. **ログ機能テスト**

   - 構造化ログエントリの生成
   - パフォーマンストラッキング
   - モニタリング統計の計算
   - アラート条件の検出

3. **統合テスト**
   - エラーハンドラーとログシステムの連携
   - モニタリングサービスの統計記録
   - パフォーマンストラッキングの動作

## 使用方法

### エラーハンドリング

```typescript
import { errorHandler } from "@/lib/services/error-handler";

try {
  // 何らかの処理
} catch (error) {
  const response = errorHandler.handle(error, { sessionId, userId });
  return response;
}
```

### ログ記録

```typescript
import { aiRecommendationLogger } from "@/lib/services/logger";

const tracker = aiRecommendationLogger.startTracking();
aiRecommendationLogger.logRecommendationStart(context);

// 処理実行...

aiRecommendationLogger.logRecommendationComplete(context, count);
```

### モニタリング

```typescript
import { monitoringService } from "@/lib/services/logger";

// 成功時
monitoringService.recordSuccess(metrics);

// エラー時
monitoringService.recordError(category, code);

// 統計取得
const stats = monitoringService.getStats();
const alerts = monitoringService.checkAlerts();
```

## 今後の拡張

1. **外部ログサービス統合**

   - CloudWatch、Datadog 等への出力対応
   - ログレベル別の出力先設定

2. **アラート通知**

   - Slack、メール等への自動通知
   - カスタムアラート条件の設定

3. **ダッシュボード**

   - リアルタイム監視画面
   - パフォーマンスメトリクスの可視化

4. **ログ分析**
   - エラーパターンの自動検出
   - パフォーマンス改善提案
