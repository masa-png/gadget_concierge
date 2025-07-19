/**
 * 日付フォーマット用ユーティリティ
 */

/**
 * UTCDateを日本時間に変換してフォーマット
 */
export function formatToJapanTime(date: Date | string): string {
  const parsedDate = typeof date === "string" ? new Date(date) : date;

  return parsedDate.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * UTCDateを日本時間の日付のみでフォーマット
 */
export function formatToJapanDate(date: Date | string): string {
  const parsedDate = typeof date === "string" ? new Date(date) : date;

  return parsedDate.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * UTCDateを日本時間の時刻のみでフォーマット
 */
export function formatToJapanTimeOnly(date: Date | string): string {
  const parsedDate = typeof date === "string" ? new Date(date) : date;

  return parsedDate.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * 日本時間の現在日時を取得
 */
export function getJapanNow(): Date {
  return new Date();
}

/**
 * 相対時間表示（○分前、○時間前など）
 */
export function formatRelativeTime(date: Date | string): string {
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "たった今";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return formatToJapanDate(parsedDate);
  }
}
