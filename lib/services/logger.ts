/**
 * 構造化ログとモニタリング機能
 *
 * セッションID、ユーザーコンテキスト、処理時間を含むログ記録機能と
 * エラー詳細とスタックトレースの記録機能を提供します。
 *
 * 要件: 6.1, 6.2, 6.3, 6.4, 6.5
 */

/**
 * ログレベルの定義
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

/**
 * ログコンテキストの基本型
 */
export interface BaseLogContext {
  sessionId?: string;
  userId?: string;
  userProfileId?: string;
  categoryId?: string;
  operation?: string;
  timestamp?: string;
  requestId?: string;
  clientIP?: string;
}

/**
 * パフォーマンスメトリクスの型
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  aiRequestDuration?: number;
  mappingDuration?: number;
  saveDuration?: number;
  dbQueryCount?: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

/**
 * エラーログの詳細情報
 */
export interface ErrorLogDetails {
  errorCode?: string;
  errorCategory?: string;
  message: string;
  stack?: string;
  isRetryable?: boolean;
  isTemporary?: boolean;
  httpStatus?: number;
  originalError?: unknown;
}

/**
 * 構造化ログエントリ
 */
export interface StructuredLogEntry {
  level: LogLevel;
  message: string;
  context: BaseLogContext;
  metrics?: PerformanceMetrics;
  error?: ErrorLogDetails;
  extra?: Record<string, unknown>;
  timestamp: string;
}

/**
 * ログ出力インターface
 */
export interface LogOutput {
  write(entry: StructuredLogEntry): void;
}

/**
 * コンソールログ出力
 */
export class ConsoleLogOutput implements LogOutput {
  write(entry: StructuredLogEntry): void {
    const logData = {
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      ...entry.context,
      ...(entry.metrics && { metrics: entry.metrics }),
      ...(entry.error && { error: entry.error }),
      ...(entry.extra && entry.extra),
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logData, null, 2));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logData, null, 2));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logData, null, 2));
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(JSON.stringify(logData, null, 2));
        break;
    }
  }
}

/**
 * 構造化ロガー
 */
export class StructuredLogger {
  private outputs: LogOutput[] = [];
  private defaultContext: BaseLogContext = {};

  constructor(outputs: LogOutput[] = [new ConsoleLogOutput()]) {
    this.outputs = outputs;
  }

  /**
   * デフォルトコンテキストを設定
   */
  setDefaultContext(context: BaseLogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  /**
   * ログエントリを出力
   */
  private writeLog(
    level: LogLevel,
    message: string,
    context?: BaseLogContext,
    metrics?: PerformanceMetrics,
    error?: ErrorLogDetails,
    extra?: Record<string, unknown>
  ): void {
    const entry: StructuredLogEntry = {
      level,
      message,
      context: {
        ...this.defaultContext,
        ...context,
        timestamp: new Date().toISOString(),
      },
      metrics,
      error,
      extra,
      timestamp: new Date().toISOString(),
    };

    this.outputs.forEach((output) => output.write(entry));
  }

  /**
   * DEBUG レベルログ
   */
  debug(
    message: string,
    context?: BaseLogContext,
    extra?: Record<string, unknown>
  ): void {
    this.writeLog(
      LogLevel.DEBUG,
      message,
      context,
      undefined,
      undefined,
      extra
    );
  }

  /**
   * INFO レベルログ（要件 6.4: 正常フロー、処理時間）
   */
  info(
    message: string,
    context?: BaseLogContext,
    metrics?: PerformanceMetrics,
    extra?: Record<string, unknown>
  ): void {
    this.writeLog(LogLevel.INFO, message, context, metrics, undefined, extra);
  }

  /**
   * WARN レベルログ
   */
  warn(
    message: string,
    context?: BaseLogContext,
    extra?: Record<string, unknown>
  ): void {
    this.writeLog(LogLevel.WARN, message, context, undefined, undefined, extra);
  }

  /**
   * ERROR レベルログ（要件 6.3: エラー詳細とスタックトレースの記録）
   */
  error(
    message: string,
    error: unknown,
    context?: BaseLogContext,
    extra?: Record<string, unknown>
  ): void {
    const errorDetails = this.extractErrorDetails(error);
    this.writeLog(
      LogLevel.ERROR,
      message,
      context,
      undefined,
      errorDetails,
      extra
    );
  }

  /**
   * FATAL レベルログ
   */
  fatal(
    message: string,
    error: unknown,
    context?: BaseLogContext,
    extra?: Record<string, unknown>
  ): void {
    const errorDetails = this.extractErrorDetails(error);
    this.writeLog(
      LogLevel.FATAL,
      message,
      context,
      undefined,
      errorDetails,
      extra
    );
  }

  /**
   * エラーから詳細情報を抽出
   */
  private extractErrorDetails(error: unknown): ErrorLogDetails {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        errorCode: "code" in error ? String(error.code) : undefined,
        errorCategory: "category" in error ? String(error.category) : undefined,
        isRetryable:
          "isRetryable" in error ? Boolean(error.isRetryable) : undefined,
        isTemporary:
          "isTemporary" in error ? Boolean(error.isTemporary) : undefined,
        httpStatus:
          "httpStatus" in error ? Number(error.httpStatus) : undefined,
        originalError: error,
      };
    }

    return {
      message: String(error),
      originalError: error,
    };
  }
}

/**
 * パフォーマンス測定ユーティリティ
 */
export class PerformanceTracker {
  private startTime: number;
  private metrics: PerformanceMetrics;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      startTime: this.startTime,
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * AI リクエスト時間を記録
   */
  recordAIRequest(duration: number): void {
    this.metrics.aiRequestDuration = duration;
  }

  /**
   * マッピング時間を記録
   */
  recordMapping(duration: number): void {
    this.metrics.mappingDuration = duration;
  }

  /**
   * 保存時間を記録
   */
  recordSave(duration: number): void {
    this.metrics.saveDuration = duration;
  }

  /**
   * DB クエリ数を記録
   */
  recordDbQuery(count: number): void {
    this.metrics.dbQueryCount = (this.metrics.dbQueryCount || 0) + count;
  }

  /**
   * 処理完了時のメトリクスを取得
   */
  finish(): PerformanceMetrics {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.metrics.memoryUsage = process.memoryUsage();
    return { ...this.metrics };
  }

  /**
   * 現在のメトリクスを取得（処理中）
   */
  getCurrent(): PerformanceMetrics {
    return {
      ...this.metrics,
      duration: Date.now() - this.metrics.startTime,
      memoryUsage: process.memoryUsage(),
    };
  }
}

/**
 * AI レコメンド専用ロガー
 */
export class AIRecommendationLogger {
  private logger: StructuredLogger;
  private tracker?: PerformanceTracker;

  constructor(logger?: StructuredLogger) {
    this.logger = logger || new StructuredLogger();
  }

  /**
   * パフォーマンストラッキング開始
   */
  startTracking(): PerformanceTracker {
    this.tracker = new PerformanceTracker();
    return this.tracker;
  }

  /**
   * レコメンド生成開始ログ（要件 6.1: セッションIDとユーザーコンテキストのログ記録）
   */
  logRecommendationStart(context: BaseLogContext): void {
    this.logger.info(
      "AIレコメンド生成開始",
      context,
      this.tracker?.getCurrent()
    );
  }

  /**
   * AI リクエスト開始ログ（要件 6.2: AI リクエスト詳細とレスポンス時間のログ記録）
   */
  logAIRequestStart(context: BaseLogContext, promptLength: number): void {
    this.logger.info("AI リクエスト開始", context, this.tracker?.getCurrent(), {
      promptLength,
    });
  }

  /**
   * AI リクエスト完了ログ（要件 6.2: AI リクエスト詳細とレスポンス時間のログ記録）
   */
  logAIRequestComplete(
    context: BaseLogContext,
    duration: number,
    recommendationsCount: number
  ): void {
    this.tracker?.recordAIRequest(duration);
    this.logger.info("AI リクエスト完了", context, this.tracker?.getCurrent(), {
      aiRequestDuration: duration,
      recommendationsCount,
    });
  }

  /**
   * 商品マッピング開始ログ
   */
  logMappingStart(context: BaseLogContext, itemsToMap: number): void {
    this.logger.info(
      "商品マッピング開始",
      context,
      this.tracker?.getCurrent(),
      {
        itemsToMap,
      }
    );
  }

  /**
   * 商品マッピング完了ログ
   */
  logMappingComplete(
    context: BaseLogContext,
    duration: number,
    mappingStats: Record<string, unknown>
  ): void {
    this.tracker?.recordMapping(duration);
    this.logger.info(
      "商品マッピング完了",
      context,
      this.tracker?.getCurrent(),
      {
        mappingDuration: duration,
        mappingStats,
      }
    );
  }

  /**
   * データベース保存開始ログ
   */
  logSaveStart(context: BaseLogContext, itemsToSave: number): void {
    this.logger.info(
      "データベース保存開始",
      context,
      this.tracker?.getCurrent(),
      {
        itemsToSave,
      }
    );
  }

  /**
   * データベース保存完了ログ（要件 6.5: 監査目的でトランザクション詳細をログ記録）
   */
  logSaveComplete(
    context: BaseLogContext,
    duration: number,
    savedCount: number
  ): void {
    this.tracker?.recordSave(duration);
    this.logger.info(
      "データベース保存完了",
      context,
      this.tracker?.getCurrent(),
      {
        saveDuration: duration,
        savedCount,
      }
    );
  }

  /**
   * レコメンド生成完了ログ（要件 6.4: 正常生成時の件数と基本メタデータ記録）
   */
  logRecommendationComplete(
    context: BaseLogContext,
    finalCount: number,
    extra?: Record<string, unknown>
  ): void {
    const metrics = this.tracker?.finish();
    this.logger.info("AIレコメンド生成完了", context, metrics, {
      finalRecommendationsCount: finalCount,
      ...extra,
    });
  }

  /**
   * エラーログ（要件 6.3: エラー詳細とスタックトレースの記録）
   */
  logError(
    message: string,
    error: unknown,
    context: BaseLogContext,
    extra?: Record<string, unknown>
  ): void {
    const metrics = this.tracker?.getCurrent();
    this.logger.error(message, error, context, { ...extra, metrics });
  }

  /**
   * 警告ログ
   */
  logWarning(
    message: string,
    context: BaseLogContext,
    extra?: Record<string, unknown>
  ): void {
    this.logger.warn(message, context, extra);
  }

  /**
   * デバッグログ
   */
  logDebug(
    message: string,
    context: BaseLogContext,
    extra?: Record<string, unknown>
  ): void {
    this.logger.debug(message, context, extra);
  }
}

/**
 * モニタリング統計情報
 */
export interface MonitoringStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  averageAIRequestTime: number;
  averageMappingTime: number;
  averageSaveTime: number;
  errorsByCategory: Record<string, number>;
  errorsByCode: Record<string, number>;
  lastUpdated: string;
}

/**
 * モニタリングサービス
 */
export class MonitoringService {
  private stats: MonitoringStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    averageAIRequestTime: 0,
    averageMappingTime: 0,
    averageSaveTime: 0,
    errorsByCategory: {},
    errorsByCode: {},
    lastUpdated: new Date().toISOString(),
  };

  private responseTimes: number[] = [];
  private aiRequestTimes: number[] = [];
  private mappingTimes: number[] = [];
  private saveTimes: number[] = [];

  /**
   * 成功リクエストを記録
   */
  recordSuccess(metrics: PerformanceMetrics): void {
    this.stats.totalRequests++;
    this.stats.successfulRequests++;

    if (metrics.duration) {
      this.responseTimes.push(metrics.duration);
      this.stats.averageResponseTime = this.calculateAverage(
        this.responseTimes
      );
    }

    if (metrics.aiRequestDuration) {
      this.aiRequestTimes.push(metrics.aiRequestDuration);
      this.stats.averageAIRequestTime = this.calculateAverage(
        this.aiRequestTimes
      );
    }

    if (metrics.mappingDuration) {
      this.mappingTimes.push(metrics.mappingDuration);
      this.stats.averageMappingTime = this.calculateAverage(this.mappingTimes);
    }

    if (metrics.saveDuration) {
      this.saveTimes.push(metrics.saveDuration);
      this.stats.averageSaveTime = this.calculateAverage(this.saveTimes);
    }

    this.stats.lastUpdated = new Date().toISOString();
  }

  /**
   * エラーリクエストを記録
   */
  recordError(errorCategory: string, errorCode: string): void {
    this.stats.totalRequests++;
    this.stats.failedRequests++;

    this.stats.errorsByCategory[errorCategory] =
      (this.stats.errorsByCategory[errorCategory] || 0) + 1;

    this.stats.errorsByCode[errorCode] =
      (this.stats.errorsByCode[errorCode] || 0) + 1;

    this.stats.lastUpdated = new Date().toISOString();
  }

  /**
   * 統計情報を取得
   */
  getStats(): MonitoringStats {
    return { ...this.stats };
  }

  /**
   * 統計情報をリセット
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      averageAIRequestTime: 0,
      averageMappingTime: 0,
      averageSaveTime: 0,
      errorsByCategory: {},
      errorsByCode: {},
      lastUpdated: new Date().toISOString(),
    };

    this.responseTimes = [];
    this.aiRequestTimes = [];
    this.mappingTimes = [];
    this.saveTimes = [];
  }

  /**
   * 平均値を計算（直近100件まで）
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;

    // 直近100件のみを保持
    const recentValues = values.slice(-100);
    const sum = recentValues.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / recentValues.length);
  }

  /**
   * アラート条件をチェック
   */
  checkAlerts(): {
    highErrorRate: boolean;
    slowResponse: boolean;
    aiServiceIssue: boolean;
  } {
    const errorRate =
      this.stats.totalRequests > 0
        ? this.stats.failedRequests / this.stats.totalRequests
        : 0;

    return {
      highErrorRate: errorRate > 0.5, // 50%以上のエラー率
      slowResponse: this.stats.averageResponseTime > 30000, // 30秒以上の平均レスポンス時間
      aiServiceIssue: this.stats.averageAIRequestTime > 25000, // 25秒以上のAI応答時間
    };
  }
}

// シングルトンインスタンス
export const aiRecommendationLogger = new AIRecommendationLogger();
export const monitoringService = new MonitoringService();

/**
 * ログユーティリティ関数
 */
export const logUtils = {
  /**
   * リクエストコンテキストを作成
   */
  createRequestContext(
    sessionId: string,
    userId: string,
    operation: string,
    extra?: Record<string, unknown>
  ): BaseLogContext {
    return {
      sessionId,
      userId,
      operation,
      timestamp: new Date().toISOString(),
      ...extra,
    };
  },

  /**
   * エラーコンテキストを作成
   */
  createErrorContext(
    sessionId: string,
    userId: string,
    operation: string,
    duration?: number,
    extra?: Record<string, unknown>
  ): BaseLogContext {
    return {
      sessionId,
      userId,
      operation,
      timestamp: new Date().toISOString(),
      ...(duration && { duration }),
      ...extra,
    };
  },

  /**
   * パフォーマンスメトリクスをログ用に変換
   */
  formatMetrics(metrics: PerformanceMetrics): Record<string, unknown> {
    return {
      duration: metrics.duration,
      aiRequestDuration: metrics.aiRequestDuration,
      mappingDuration: metrics.mappingDuration,
      saveDuration: metrics.saveDuration,
      dbQueryCount: metrics.dbQueryCount,
      memoryUsage: metrics.memoryUsage
        ? {
            rss: Math.round(metrics.memoryUsage.rss / 1024 / 1024), // MB
            heapUsed: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024), // MB
          }
        : undefined,
    };
  },
};
