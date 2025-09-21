# 回答処理サービス実装

## 概要

回答処理サービスは、データベースからのアンケート回答の取得と処理を担当するために正常に実装されました。このサービスは、AI レコメンド生成システムの中核コンポーネントです。

## 実装された機能

### タスク 2.1: 回答データ取得と JOIN クエリの実装 ✅

- **セッション検証**: アンケートセッションが存在し完了していることを検証
- **効率的な JOIN クエリ**: 最適化されたクエリで Question と QuestionOption データと共に回答を取得
- **データ整合性**: 必要なすべてのリレーションが適切に読み込まれることを保証

### タスク 2.2: 質問タイプ別データ構造化の実装 ✅

- **質問タイプサポート**: すべての質問タイプ（SINGLE_CHOICE、MULTIPLE_CHOICE、RANGE、TEXT）を処理
- **複数選択処理**: MULTIPLE_CHOICE 質問の複数選択されたオプションを適切に結合
- **データ検証**: 回答データの整合性を検証し、無効なデータに対して適切なエラーをスロー
- **テキストサニタイゼーション**: AI 処理のために PII を除去し、テキスト入力を正規化
- **AI 対応構造化**: AI 処理に最適化された統一データ形式を作成

## 主要コンポーネント

### AnswerProcessor クラス

```typescript
class AnswerProcessor implements AnswerProcessorService {
  // メインメソッド
  async processSessionAnswers(sessionId: string): Promise<ProcessedAnswer[]>;
  async structureForAI(answers: ProcessedAnswer[]): Promise<AIInputData>;

  // プライベートヘルパーメソッド
  private validateSession(sessionId: string): Promise<SessionWithCategory>;
  private retrieveAnswersWithJoins(sessionId: string): Promise<RawAnswerData[]>;
  private groupAnswersByQuestion(
    rawAnswers: RawAnswerData[]
  ): Map<string, RawAnswerData[]>;
  private processGroupedAnswers(
    groupedAnswers: Map<string, RawAnswerData[]>
  ): ProcessedAnswer[];
  private processAnswer(rawAnswer: RawAnswerData): ProcessedAnswer;
  private processMultipleChoiceAnswers(
    answers: RawAnswerData[]
  ): ProcessedAnswer;
  private sanitizeTextInput(text: string): string;
  private analyzeAnswerPatterns(
    answers: ProcessedAnswer[]
  ): Record<string, unknown>;
}
```

### データフロー

1. **入力**: セッション ID（CUID）
2. **検証**: セッションが存在し、ステータス = 'COMPLETED'であることを確認
3. **取得**: Question と QuestionOption テーブルとの JOIN で回答を取得
4. **グループ化**: 複数選択を処理するために質問 ID で回答をグループ化
5. **処理**: 質問タイプに基づいて生データを ProcessedAnswer 形式に変換
6. **構造化**: AI 処理のためにカテゴリとユーザーコンテキストと組み合わせ
7. **出力**: AI レコメンド生成の準備ができた AIInputData

### 質問タイプ処理

- **SINGLE_CHOICE**: オプション選択を検証し、ラベルと値を抽出
- **MULTIPLE_CHOICE**: 複数のオプションをカンマ区切り値に結合
- **RANGE**: 範囲境界（0-100）を検証し、数値を抽出
- **TEXT**: 入力をサニタイズし、PII を除去し、形式を正規化

### エラーハンドリング

- セッションが見つからない、または完了していない
- 必要な質問タイプの回答データが不足
- 無効な範囲値（0-100 境界外）
- 単一回答質問タイプに対する複数回答
- 選択ベース質問のオプション不足

### セキュリティ機能

- **PII 除去**: テキストからメールアドレスと電話番号を自動除去
- **入力サニタイゼーション**: 空白を正規化し、テキスト長を制限
- **データ検証**: すべての入力データの厳密な検証

## 使用例

```typescript
import { createAnswerProcessor } from "./answer-processor";

const processor = createAnswerProcessor();

// 完了したセッションの回答を処理
const answers = await processor.processSessionAnswers("session-id");

// AI処理用に構造化
const aiData = await processor.structureForAI(answers);

// AIレコメンド生成にaiDataを使用
```

## 満たされた要件

### 要件 1.2 ✅

- システムが QuestionnaireSession が存在し、status='COMPLETED'であることを検証
- Question と QuestionOption テーブルとの JOIN ですべての回答を取得

### 要件 1.3 ✅

- すべての質問タイプ（SINGLE_CHOICE、MULTIPLE_CHOICE、RANGE、TEXT）を処理
- AI 処理に適した構造化データを作成
- 複数選択を持つ複数選択質問を処理

### 要件 3.4 ✅

- AI 処理用の統一データ形式を実装
- 適切なデータ構造化と検証を提供
- 強化された AI コンテキストのための回答パターン分析を含む

## 統合ポイント

このサービスは以下と統合されます：

- **Prisma ORM**: データベースクエリとタイプセーフティのため
- **AI レコメンドタイプ**: 共有 TypeScript インターフェースを使用
- **プロンプト生成サービス**: プロンプト生成のための構造化データを提供
- **エラーハンドリングシステム**: ダウンストリーム処理のための適切なエラーをスロー

## 次のステップ

回答処理サービスは、メインの AI レコメンド生成ワークフローに統合する準備ができました。実装計画の次のタスクは：

- タスク 3: プロンプト生成サービスの実装
- タスク 4: Mastra AI 連携サービスの実装
- タスク 5: 商品マッピングサービスの実装

## 作成されたファイル

- `lib/services/answer-processor.ts` - メインサービス実装
- `lib/services/answer-processor-example.ts` - 使用例とパターン
- `lib/services/README-answer-processor.md` - このドキュメント
