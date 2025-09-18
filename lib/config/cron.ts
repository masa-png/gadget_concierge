// Cron job configuration
export const SECURITY_CONFIG = {
  // レート制限設定
  RATE_LIMIT: {
    MAX_REQUESTS: 10, // 最大リクエスト数
    WINDOW_MS: 3600000, // 1時間（ミリ秒）
  },
};

// Rakuten API設定
export const RAKUTEN_API_CONFIG = {
  BASE_URL: "https://app.rakuten.co.jp/services/api",
  APP_ID: process.env.RAKUTEN_APP_ID,
  AFFILIATE_ID: process.env.RAKUTEN_AFFILIATE_ID,
  VERSION: "20220601",
  CATEGORIES: {
    COMPUTER: "565162",
    PC_PARTS: "100087",
    DISPLAY: "110105",
    INPUT_DEVICE: "303087",
    GAMING: "567167",
    SMARTPHONE: "560202",
    TABLET: "560029",
    SMARTWATCH: "564895",
    BATTERY: "509433",
    AUDIO: "408507",
  },
};

// カテゴリ名マッピング
export const CATEGORY_NAMES: { [key: string]: string } = {
  "565162": "パソコン",
  "100087": "PCパーツ",
  "110105": "ディスプレイ",
  "303087": "マウス・キーボード・入力機器",
  "567167": "ゲーム用機器",
  "560202": "スマートフォン本体",
  "560029": "タブレットPC本体",
  "564895": "スマートウォッチ本体",
  "509433": "バッテリー・充電器",
  "408507": "ヘッドセット・イヤホンマイク",
};