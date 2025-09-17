import { CATEGORY_NAMES } from "@/lib/config/cron";

// 特徴抽出関数
export function extractFeatures(description: string, name: string): string {
  if (!description) return name;

  const featureKeywords = [
    "GB",
    "インチ",
    "カメラ",
    "バッテリー",
    "防水",
    "5G",
    "SIM",
    "CPU",
    "メモリ",
    "SSD",
    "HDD",
    "グラフィック",
    "Office",
    "Windows",
    "Mac",
    "万画素",
    "ズーム",
    "手ブレ",
    "4K",
    "動画",
    "レンズ",
    "新品",
    "正規品",
    "保証",
    "送料無料",
    "即日発送",
  ];

  const features = [];
  const words = description.split(/[・\s,、。\n]+/);

  for (const word of words) {
    const trimmedWord = word.trim();
    if (
      trimmedWord.length > 2 &&
      featureKeywords.some((keyword) => trimmedWord.includes(keyword))
    ) {
      features.push(trimmedWord);
    }
    if (features.length >= 6) break;
  }

  return features.length > 0 ? features.join("・") : name.substring(0, 100);
}

// カテゴリ名取得
export function getCategoryName(categoryId: string): string {
  return CATEGORY_NAMES[categoryId] || "その他";
}

// 製品説明を結合
export function buildProductDescription(itemCaption?: string, itemName?: string, catchcopy?: string): string {
  let description = itemCaption || itemName || "";
  if (catchcopy && catchcopy !== description) {
    description = `${catchcopy}\n${description}`;
  }
  return description;
}