/**
 * セキュリティユーティリティ
 *
 * AI推奨システムで使用するセキュリティ関連の機能を提供します。
 * 入力サニタイゼーション、PII除去、APIキー管理、タイムアウト制御を含みます。
 */

import { z } from "zod";

/**
 * 個人識別情報（PII）のパターン定義
 */
const PII_PATTERNS = {
  // 電話番号（日本の形式）
  phoneNumber: /(\d{2,4}-\d{2,4}-\d{4}|\d{10,11})/g,
  // メールアドレス
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // 郵便番号（日本の形式）
  postalCode: /\d{3}-\d{4}/g,
  // クレジットカード番号（基本的なパターン）
  creditCard: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  // 住所の可能性が高い文字列（都道府県名を含む）
  address:
    /(東京都|大阪府|京都府|北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)[^\s]{1,50}/g,
} as const;

/**
 * 入力サニタイゼーション用のスキーマ
 */
const sanitizationSchema = z.object({
  // HTMLタグを除去
  removeHtml: z.boolean().default(true),
  // スクリプトタグを除去
  removeScripts: z.boolean().default(true),
  // PII情報を除去
  removePII: z.boolean().default(true),
  // 最大文字数制限
  maxLength: z.number().int().positive().default(10000),
  // 許可する文字セット（正規表現）
  allowedChars: z.string().optional(),
});

/**
 * サニタイゼーションオプション
 */
export type SanitizationOptions = z.infer<typeof sanitizationSchema>;

/**
 * 文字列から個人識別情報（PII）を除去する
 * @param text 処理対象のテキスト
 * @param replacement 置換文字列（デフォルト: [REDACTED]）
 * @returns PII が除去されたテキスト
 */
export function removePII(
  text: string,
  replacement: string = "[REDACTED]"
): string {
  let sanitized = text;

  // 各PIIパターンを置換
  Object.entries(PII_PATTERNS).forEach(([pattern]) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  return sanitized;
}

/**
 * HTMLタグとスクリプトを除去する
 * @param text 処理対象のテキスト
 * @returns サニタイズされたテキスト
 */
export function removeHtmlAndScripts(text: string): string {
  // スクリプトタグとその内容を先に除去（より厳密なパターン）
  let sanitized = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // 他のHTMLタグを除去
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // HTMLエンティティをデコード
  sanitized = sanitized
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

  return sanitized;
}

/**
 * 包括的な入力サニタイゼーション
 * @param input 処理対象の入力値
 * @param options サニタイゼーションオプション
 * @returns サニタイズされた文字列
 * @throws Error 入力が無効な場合
 */
export function sanitizeInput(
  input: unknown,
  options: Partial<SanitizationOptions> = {}
): string {
  // オプションの検証とデフォルト値設定
  const opts = sanitizationSchema.parse(options);

  // 入力値を文字列に変換
  let sanitized = String(input || "");

  // 最大文字数チェック
  if (sanitized.length > opts.maxLength) {
    throw new Error(`入力が最大文字数（${opts.maxLength}）を超えています`);
  }

  // HTMLタグとスクリプトの除去
  if (opts.removeHtml || opts.removeScripts) {
    sanitized = removeHtmlAndScripts(sanitized);
  }

  // PII情報の除去
  if (opts.removePII) {
    sanitized = removePII(sanitized);
  }

  // 許可文字セットのチェック
  if (opts.allowedChars) {
    const allowedPattern = new RegExp(`^[${opts.allowedChars}]*$`);
    if (!allowedPattern.test(sanitized)) {
      throw new Error("許可されていない文字が含まれています");
    }
  }

  // 前後の空白を除去
  return sanitized.trim();
}

/**
 * APIキーの妥当性を検証する
 * @param apiKey 検証対象のAPIキー
 * @param keyName キー名（エラーメッセージ用）
 * @returns 検証されたAPIキー
 * @throws Error APIキーが無効な場合
 */
export function validateApiKey(
  apiKey: unknown,
  keyName: string = "API key"
): string {
  if (typeof apiKey !== "string" || !apiKey) {
    throw new Error(`${keyName}が設定されていません`);
  }

  // 基本的な形式チェック
  if (apiKey.length < 10) {
    throw new Error(`${keyName}が短すぎます（最低10文字必要）`);
  }

  // 危険な文字列のチェック
  const dangerousPatterns = [
    /[<>]/, // HTMLタグ
    /javascript:/i, // JavaScriptプロトコル
    /data:/i, // データURL
    /vbscript:/i, // VBScript
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(apiKey)) {
      throw new Error(`${keyName}に無効な文字が含まれています`);
    }
  }

  return apiKey;
}

/**
 * タイムアウト制御付きのPromise実行
 * @param promise 実行対象のPromise
 * @param timeoutMs タイムアウト時間（ミリ秒）
 * @param errorMessage タイムアウト時のエラーメッセージ
 * @returns Promise結果
 * @throws Error タイムアウトまたは実行エラー
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "操作がタイムアウトしました"
): Promise<T> {
  // タイムアウト値の検証
  if (timeoutMs <= 0 || timeoutMs > 300000) {
    // 最大5分
    throw new Error(
      "タイムアウト値は1ms〜300000ms（5分）の範囲で設定してください"
    );
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${errorMessage}（${timeoutMs}ms）`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * レート制限チェック用のメモリストア
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * シンプルなレート制限チェック
 * @param key レート制限のキー（通常はIPアドレスやユーザーID）
 * @param maxRequests 制限時間内の最大リクエスト数
 * @param windowMs 制限時間（ミリ秒）
 * @returns レート制限に引っかからない場合はtrue
 * @throws Error レート制限に引っかかった場合
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1分
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // 初回または期間経過後はリセット
  if (!record || now >= record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  // 制限チェック
  if (record.count >= maxRequests) {
    const remainingTime = Math.ceil((record.resetTime - now) / 1000);
    throw new Error(
      `レート制限に達しました。${remainingTime}秒後に再試行してください`
    );
  }

  // カウント増加
  record.count++;
  return true;
}

/**
 * セキュアなランダム文字列生成
 * @param length 生成する文字列の長さ
 * @param charset 使用する文字セット
 * @returns ランダム文字列
 */
export function generateSecureRandomString(
  length: number = 32,
  charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
): string {
  if (length <= 0 || length > 1000) {
    throw new Error("文字列長は1〜1000の範囲で指定してください");
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * 機密情報をマスクする
 * @param value マスク対象の値
 * @param visibleChars 表示する文字数（前後）
 * @param maskChar マスク文字
 * @returns マスクされた文字列
 */
export function maskSensitiveData(
  value: string,
  visibleChars: number = 4,
  maskChar: string = "*"
): string {
  if (!value || value.length <= visibleChars * 2) {
    return maskChar.repeat(8); // 短い値は完全にマスク
  }

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const maskLength = Math.max(4, value.length - visibleChars * 2);

  return `${start}${maskChar.repeat(maskLength)}${end}`;
}
