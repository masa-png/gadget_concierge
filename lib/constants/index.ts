// アプリケーション定数
export const APP_NAME = "ガジェットコンシェルジュ";
export const APP_DESCRIPTION = "「分からない」を「見つかる」に変える、あなただけのガジェット選びコンシェルジュ。";

// API関連の定数
export const API_ENDPOINTS = {
  PROFILE: "/api/profile",
  AUTH: "/api/auth",
} as const;

// キャッシュ関連の定数
export const CACHE_KEYS = {
  PROFILE: "profile",
  USER: "user",
} as const;

export const CACHE_DURATION = {
  SHORT: 60, // 1分
  MEDIUM: 300, // 5分
  LONG: 3600, // 1時間
} as const;

// UI関連の定数
export const FORM_VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  FULL_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
  },
} as const;