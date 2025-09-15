import { PrismaClient } from "@prisma/client";
import { QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

// ===== データ定義 =====

interface CategoryData {
  name: string;
  description: string;
  parentId?: string;
}

interface ProductData {
  name: string;
  description: string;
  price: number;
  rating: number;
  features: string;
  rakuten_url: string;
  image_url: string;
}

interface TagData {
  name: string;
  description: string;
  color: string;
}

// メインカテゴリデータ
const MAIN_CATEGORIES: CategoryData[] = [
  {
    name: "パソコン",
    description: "ノートPC・デスクトップPC・サーバー・ワークステーション",
  },
  { name: "PCパーツ", description: "パソコンの内蔵パーツ・拡張部品" },
  { name: "ディスプレイ", description: "液晶モニター・ゲーミングモニター" },
  {
    name: "マウス・キーボード・入力機器",
    description: "マウス・キーボード・ペンタブレット等の入力機器",
  },
  { name: "ゲーム用機器", description: "ゲーミング周辺機器・コントローラー" },
  {
    name: "スマートフォン本体",
    description: "iPhone・Android端末・SIMフリー端末",
  },
  {
    name: "タブレットPC本体",
    description: "iPad・Androidタブレット・Windowsタブレット",
  },
  {
    name: "スマートウォッチ本体",
    description: "Apple Watch・ウェアラブル端末",
  },
  {
    name: "バッテリー・充電器",
    description: "モバイルバッテリー・充電器・電源関連機器",
  },
  {
    name: "ヘッドセット・イヤホンマイク",
    description: "ヘッドセット・イヤホン・マイク・オーディオ機器",
  },
];

// サブカテゴリデータ
const SUB_CATEGORIES: { [key: string]: CategoryData[] } = {
  パソコン: [
    { name: "ノートPC", description: "ノートパソコン・ウルトラブック" },
    { name: "デスクトップPC", description: "デスクトップパソコン・一体型PC" },
    {
      name: "PCサーバー・ワークステーション",
      description: "サーバー・ワークステーション・業務用PC",
    },
    { name: "スティックPC", description: "小型PC・スティック型PC" },
  ],
  PCパーツ: [
    {
      name: "内蔵ドライブ・ストレージ",
      description: "SSD・HDD・M.2・内蔵ドライブ",
    },
    {
      name: "グラフィックボード",
      description: "GPU・グラフィックカード・ビデオカード",
    },
    { name: "CPU", description: "プロセッサー・中央処理装置" },
    { name: "増設メモリ", description: "RAM・メモリモジュール" },
    { name: "マザーボード", description: "メインボード・マザーボード" },
    { name: "冷却パーツ", description: "CPUクーラー・ケースファン・水冷" },
    {
      name: "PCケース・筐体",
      description: "ミドルタワー・フルタワー・ミニITX",
    },
    { name: "PCケース用電源", description: "ATX電源・SFX電源・電源ユニット" },
  ],
  "マウス・キーボード・入力機器": [
    {
      name: "マウス",
      description: "有線マウス・ワイヤレスマウス・トラックボール",
    },
    {
      name: "キーボード",
      description: "メカニカル・メンブレン・無線キーボード",
    },
    {
      name: "ペンタブレット",
      description: "ペンタブレット・液晶タブレット・デジタイザー",
    },
    {
      name: "キーボード・マウスセット",
      description: "キーボードとマウスのセット商品",
    },
    { name: "テンキー", description: "外付けテンキー・数値入力パッド" },
  ],
  ゲーム用機器: [
    {
      name: "ゲーミングヘッドセット",
      description: "ゲーム用ヘッドセット・7.1ch対応",
    },
    {
      name: "ゲーミングキーボード",
      description: "ゲーム用キーボード・RGB・メカニカル",
    },
    { name: "ゲーミングマウス", description: "ゲーム用マウス・高DPI・RGB" },
    { name: "ゲームパッド", description: "コントローラー・ワイヤレスパッド" },
    {
      name: "ジョイスティック",
      description: "アーケードスティック・フライトスティック",
    },
  ],
  "バッテリー・充電器": [
    {
      name: "モバイルバッテリー",
      description: "ポータブル充電器・大容量バッテリー",
    },
    { name: "AC式充電器", description: "コンセント充電器・USB充電器・PD対応" },
    {
      name: "ワイヤレス充電器",
      description: "Qi充電器・置くだけ充電・MagSafe",
    },
    {
      name: "ソーラーチャージャー",
      description: "太陽光充電器・アウトドア用充電器",
    },
    {
      name: "交換用電池パック",
      description: "スマホ・ノートPC用バッテリー交換",
    },
    { name: "ケース型バッテリー", description: "スマホケース一体型バッテリー" },
    {
      name: "クレードル・ドック",
      description: "充電スタンド・ドッキングステーション",
    },
  ],
};

// タグデータ
const TAGS: TagData[] = [
  { name: "送料無料", description: "送料無料商品", color: "#FF6B6B" },
  {
    name: "ポイント10倍",
    description: "楽天ポイント10倍対象",
    color: "#4ECDC4",
  },
  { name: "即日配送", description: "即日配送対応", color: "#45B7D1" },
  {
    name: "レビュー高評価",
    description: "レビュー評価4.5以上",
    color: "#96CEB4",
  },
  { name: "在庫限り", description: "在庫限りの特価商品", color: "#FECA57" },
  { name: "SIMフリー", description: "SIMフリー端末", color: "#FF9FF3" },
  {
    name: "国内正規品",
    description: "国内正規品・メーカー保証付き",
    color: "#54A0FF",
  },
  { name: "新品未開封", description: "新品未開封品", color: "#5F27CD" },
  { name: "RGB対応", description: "RGBライティング対応", color: "#A55EEA" },
  { name: "高性能", description: "ハイエンド・高性能モデル", color: "#26A69A" },
];

// 製品データ
const PRODUCTS: ProductData[] = [
  // スマートフォン
  {
    name: "iPhone 15 Pro 128GB SIMフリー",
    description:
      "Apple iPhone 15 Pro 128GB SIMフリー [ナチュラルチタニウム] 新品 国内正規品",
    price: 159800,
    rating: 4.73,
    features:
      "A17 Proチップ・6.1インチSuper Retina XDRディスプレイ・Pro 48MPカメラシステム・最大29時間のビデオ再生・チタニウムデザイン・USB-C・Dynamic Island",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  {
    name: "Galaxy S24 Ultra 256GB SIMフリー",
    description:
      "Samsung Galaxy S24 Ultra 256GB SIMフリー [チタニウムブラック] 新品未開封 国内正規品",
    price: 189800,
    rating: 4.68,
    features:
      "Snapdragon 8 Gen 3・6.8インチDynamic AMOLED 2X・200MP広角カメラ・Sペン内蔵・最大28時間のビデオ再生・5G対応",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  // ノートPC
  {
    name: "MacBook Pro 14インチ M3チップ搭載",
    description:
      "Apple MacBook Pro 14インチ M3チップ搭載 8GBメモリ 512GB SSD [スペースグレイ] 新品 国内正規品",
    price: 248800,
    rating: 4.89,
    features:
      "Apple M3チップ・8コアCPU・10コアGPU・8GBユニファイドメモリ・512GB SSD・14.2インチLiquid Retina XDRディスプレイ・最大18時間のバッテリー駆動時間",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  {
    name: "ThinkPad X1 Carbon Gen 11",
    description:
      "Lenovo ThinkPad X1 Carbon Gen 11 14型 Intel Core i7-1365U 16GB 512GB SSD Windows 11 Pro",
    price: 189800,
    rating: 4.65,
    features:
      "Intel Core i7-1365U・16GBメモリ・512GB SSD・14インチWUXGA IPS液晶・約1.12kg・最大28.5時間駆動・指紋認証・顔認証",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  // ゲーミングマウス
  {
    name: "Logicool G PRO X SUPERLIGHT ゲーミングマウス",
    description:
      "Logicool G PRO X SUPERLIGHT ワイヤレス ゲーミングマウス [ブラック] 新品",
    price: 16800,
    rating: 4.76,
    features:
      "HERO 25Kセンサー・最大25600DPI・63g軽量設計・LIGHTSPEED無線・最大70時間バッテリー・PTFE足・G HUB対応",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  {
    name: "Razer DeathAdder V3 Pro ゲーミングマウス",
    description:
      "Razer DeathAdder V3 Pro ワイヤレス ゲーミングマウス [ブラック] RGB対応",
    price: 19800,
    rating: 4.82,
    features:
      "Focus Pro 30K光学センサー・最大30000DPI・90時間バッテリー・HyperSpeed Wireless・エルゴノミクスデザイン・Razer Chroma RGB",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  // モバイルバッテリー
  {
    name: "Anker PowerCore 10000 PD Redux",
    description:
      "Anker PowerCore 10000 PD Redux 10000mAh モバイルバッテリー USB-C急速充電対応",
    price: 3990,
    rating: 4.64,
    features:
      "10000mAh容量・USB-C PD対応・18W急速充電・194g軽量・PowerIQ 3.0・MultiProtect安全システム・18ヶ月保証",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  {
    name: "cheero Power Plus 5 Stick 5000mAh",
    description:
      "cheero Power Plus 5 Stick 5000mAh モバイルバッテリー Auto-IC搭載 [ホワイト]",
    price: 2480,
    rating: 4.52,
    features:
      "5000mAh容量・Auto-IC自動最適充電・125g軽量・スティック型・LED残量表示・PSE認証・1年保証",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  // グラフィックボード
  {
    name: "NVIDIA GeForce RTX 4080 SUPER",
    description:
      "NVIDIA GeForce RTX 4080 SUPER 16GB GDDR6X グラフィックボード 新品",
    price: 149800,
    rating: 4.85,
    features:
      "Ada Lovelaceアーキテクチャ・16GB GDDR6X・DLSS 3対応・Ray Tracing・4K 120fps対応・320W TGP・PCIe 4.0",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  {
    name: "AMD Radeon RX 7700 XT",
    description:
      "AMD Radeon RX 7700 XT 12GB GDDR6 グラフィックボード RDNA 3アーキテクチャ",
    price: 64800,
    rating: 4.71,
    features:
      "RDNA 3アーキテクチャ・12GB GDDR6・1440p高fpsゲーミング・245W TBP・FSR 3対応・PCIe 4.0・AV1エンコード",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  // タブレット
  {
    name: "iPad Air 11インチ M2チップ搭載",
    description:
      "Apple iPad Air 11インチ M2チップ搭載 128GB Wi-Fi [スターライト] 新品",
    price: 98800,
    rating: 4.78,
    features:
      "Apple M2チップ・11インチLiquid Retinaディスプレイ・12MP広角カメラ・10時間バッテリー・Apple Pencil Pro対応・Magic Keyboard対応",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
  // スマートウォッチ
  {
    name: "Apple Watch Series 9 GPS 45mm",
    description:
      "Apple Watch Series 9 GPS 45mmケース [ピンクアルミニウム] スポーツバンド 新品",
    price: 59800,
    rating: 4.76,
    features:
      "S9 SiP・常時表示Retina LTPO OLEDディスプレイ・血中酸素ウェルネスアプリ・ECGアプリ・高心拍数と低心拍数の通知・最大18時間のバッテリー駆動時間",
    rakuten_url: "https://www.rakuten.co.jp/",
    image_url: "",
  },
];

// 製品とカテゴリのマッピング
const PRODUCT_CATEGORY_MAPPING: { [key: number]: string } = {
  0: "スマートフォン本体", // iPhone 15 Pro
  1: "スマートフォン本体", // Galaxy S24 Ultra
  2: "ノートPC", // MacBook Pro
  3: "ノートPC", // ThinkPad
  4: "ゲーミングマウス", // Logicool G PRO X SUPERLIGHT
  5: "ゲーミングマウス", // Razer DeathAdder V3 Pro
  6: "モバイルバッテリー", // Anker PowerCore
  7: "モバイルバッテリー", // cheero Power Plus
  8: "グラフィックボード", // RTX 4080 SUPER
  9: "グラフィックボード", // RX 7700 XT
  10: "タブレットPC本体", // iPad Air
  11: "スマートウォッチ本体", // Apple Watch
};

// 製品とタグのマッピング
const PRODUCT_TAG_MAPPING: { [key: number]: string[] } = {
  0: ["送料無料", "SIMフリー", "国内正規品", "新品未開封"], // iPhone 15 Pro
  1: ["送料無料", "ポイント10倍", "SIMフリー", "国内正規品"], // Galaxy S24 Ultra
  2: ["送料無料", "レビュー高評価", "国内正規品", "高性能"], // MacBook Pro
  3: ["送料無料", "即日配送", "レビュー高評価"], // ThinkPad
  4: ["送料無料", "レビュー高評価", "高性能"], // Logicool G PRO X SUPERLIGHT
  5: ["送料無料", "RGB対応", "高性能"], // Razer DeathAdder V3 Pro
  6: ["送料無料", "レビュー高評価", "即日配送"], // Anker PowerCore
  7: ["送料無料", "ポイント10倍"], // cheero Power Plus
  8: ["送料無料", "レビュー高評価", "高性能"], // RTX 4080 SUPER
  9: ["送料無料", "ポイント10倍", "高性能"], // RX 7700 XT
  10: ["送料無料", "レビュー高評価", "国内正規品"], // iPad Air
  11: ["送料無料", "レビュー高評価", "国内正規品"], // Apple Watch
};

// ===== ユーティリティ関数 =====

async function cleanDatabase(): Promise<void> {
  console.log("🧹 既存データをクリーンアップ中...");

  const deleteOrder = [
    "answer",
    "recommendation",
    "userHistory",
    "questionnaireSession",
    "questionOption",
    "question",
    "productTag",
    "productCategory",
    "product",
    "tag",
    "categoryCommonQuestion",
    "categoryKeyPoint",
    "category",
  ];

  for (const table of deleteOrder) {
    try {
      await (prisma as any)[table].deleteMany();
    } catch (error) {
      console.warn(`⚠️  ${table}のクリーンアップでエラー:`, error);
    }
  }

  console.log("✅ データベースクリーンアップ完了");
}

async function createCategories(): Promise<{ [key: string]: string }> {
  console.log("📁 カテゴリを作成中...");

  const categoryMap: { [key: string]: string } = {};

  // メインカテゴリを作成
  for (const categoryData of MAIN_CATEGORIES) {
    const category = await prisma.category.create({
      data: categoryData,
    });
    categoryMap[categoryData.name] = category.id;
  }

  // サブカテゴリを作成
  for (const [parentName, subCategories] of Object.entries(SUB_CATEGORIES)) {
    const parentId = categoryMap[parentName];
    if (!parentId) continue;

    for (const subCategoryData of subCategories) {
      const category = await prisma.category.create({
        data: {
          ...subCategoryData,
          parentId,
        },
      });
      categoryMap[subCategoryData.name] = category.id;
    }
  }

  console.log("✅ カテゴリ作成完了");
  return categoryMap;
}

async function createCategoryKeyPoints(categoryMap: {
  [key: string]: string;
}): Promise<void> {
  console.log("🎯 カテゴリキーポイントを作成中...");

  const keyPointsData = [
    // スマートフォン
    {
      categoryName: "スマートフォン本体",
      points: [
        "バッテリー駆動時間",
        "カメラ性能",
        "ディスプレイサイズ",
        "ストレージ容量",
        "5G対応",
      ],
    },
    // ノートPC
    {
      categoryName: "ノートPC",
      points: [
        "CPU性能",
        "メモリ容量",
        "画面サイズ",
        "重量・携帯性",
        "バッテリー駆動時間",
      ],
    },
    // ゲーミングマウス
    {
      categoryName: "ゲーミングマウス",
      points: ["DPI設定", "応答速度", "エルゴノミクス", "RGBライティング"],
    },
    // モバイルバッテリー
    {
      categoryName: "モバイルバッテリー",
      points: ["容量", "出力ポート数", "急速充電対応", "サイズ・重量"],
    },
    // グラフィックボード
    {
      categoryName: "グラフィックボード",
      points: ["GPU性能", "VRAM容量", "消費電力", "冷却性能", "4K対応"],
    },
  ];

  const keyPointsToCreate = keyPointsData.flatMap(
    ({ categoryName, points }) => {
      const categoryId = categoryMap[categoryName];
      if (!categoryId) return [];

      return points.map((point) => ({ categoryId, point }));
    }
  );

  if (keyPointsToCreate.length > 0) {
    await prisma.categoryKeyPoint.createMany({
      data: keyPointsToCreate,
    });
  }

  console.log("✅ カテゴリキーポイント作成完了");
}

async function createCommonQuestions(categoryMap: {
  [key: string]: string;
}): Promise<void> {
  console.log("❓ 一般的な質問を作成中...");

  const commonQuestionsData = [
    {
      categoryName: "スマートフォン本体",
      question: "SIMフリー端末と通信キャリア端末の違いは？",
      answer:
        "SIMフリー端末はどの通信会社でも利用可能で、通信キャリア端末は特定の会社での利用が前提となります。",
    },
    {
      categoryName: "ノートPC",
      question: "メモリは何GB必要？",
      answer:
        "一般的な用途なら8GB、動画編集やゲームなら16GB以上をおすすめします。",
    },
    {
      categoryName: "ゲーミングマウス",
      question: "DPIとは何ですか？",
      answer:
        "DPIは1インチあたりのドット数を表し、高いDPIほどマウスの感度が高くなります。",
    },
    {
      categoryName: "モバイルバッテリー",
      question: "飛行機に持ち込み可能？",
      answer: "100Wh（約27000mAh）以下であれば機内持ち込み可能です。",
    },
    {
      categoryName: "グラフィックボード",
      question: "ゲームに必要なVRAM容量は？",
      answer:
        "1080pゲームなら4-6GB、4Kゲームなら8GB以上のVRAMをおすすめします。",
    },
  ];

  const questionsToCreate = commonQuestionsData
    .map(({ categoryName, question, answer }) => {
      const categoryId = categoryMap[categoryName];
      if (!categoryId) return null;

      return { categoryId, question, answer };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (questionsToCreate.length > 0) {
    await prisma.categoryCommonQuestion.createMany({
      data: questionsToCreate,
    });
  }

  console.log("✅ 一般的な質問作成完了");
}

async function createTags(): Promise<{ id: string; name: string }[]> {
  console.log("🏷️ タグを作成中...");

  const tags = await Promise.all(
    TAGS.map((tagData) => prisma.tag.create({ data: tagData }))
  );

  console.log("✅ タグ作成完了");
  return tags;
}

async function createProducts(): Promise<{ id: string; name: string }[]> {
  console.log("📦 製品を作成中...");

  const products = await Promise.all(
    PRODUCTS.map((productData) => prisma.product.create({ data: productData }))
  );

  console.log("✅ 製品作成完了");
  return products;
}

async function createProductCategories(
  products: { id: string; name: string }[],
  categoryMap: { [key: string]: string }
): Promise<void> {
  console.log("🔗 製品とカテゴリの関連付けを作成中...");

  const productCategories = products
    .map((product, index) => {
      const categoryName = PRODUCT_CATEGORY_MAPPING[index];
      const categoryId = categoryMap[categoryName];

      if (!categoryId) {
        console.warn(
          `⚠️  製品 ${product.name} のカテゴリ ${categoryName} が見つかりません`
        );
        return null;
      }

      return { productId: product.id, categoryId };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (productCategories.length > 0) {
    await prisma.productCategory.createMany({
      data: productCategories,
    });
  }

  console.log("✅ 製品とカテゴリの関連付け完了");
}

async function createProductTags(
  products: { id: string; name: string }[],
  tags: { id: string; name: string }[]
): Promise<void> {
  console.log("🏷️ 製品とタグの関連付けを作成中...");

  const tagMap = new Map(tags.map((tag) => [tag.name, tag.id]));

  const productTags = products.flatMap((product, index) => {
    const tagNames = PRODUCT_TAG_MAPPING[index] || [];

    return tagNames
      .map((tagName) => {
        const tagId = tagMap.get(tagName);
        if (!tagId) {
          console.warn(`⚠️  タグ ${tagName} が見つかりません`);
          return null;
        }

        return { productId: product.id, tagId };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  });

  if (productTags.length > 0) {
    await prisma.productTag.createMany({
      data: productTags,
    });
  }

  console.log("✅ 製品とタグの関連付け完了");
}

// 質問と質問選択肢を作成する関数
async function createQuestionsAndOptions(categoryMap: {
  [key: string]: string;
}): Promise<void> {
  console.log("❓ 質問と選択肢を作成中...");

  // 質問データの定義
  const questionsData = [
    // パソコンの質問（親カテゴリ）
    {
      categoryName: "パソコン",
      questions: [
        {
          text: "どのようなパソコンをお探しですか？",
          description: "パソコンの種類について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ノートPC",
              description: "持ち運び可能なノートパソコン",
              value: "notebook_pc",
            },
            {
              label: "デスクトップPC",
              description: "据え置き型のデスクトップパソコン",
              value: "desktop_pc",
            },
            {
              label: "PCサーバー・ワークステーション",
              description: "サーバー・ワークステーション用途",
              value: "server_workstation",
            },
            {
              label: "スティックPC",
              description: "小型のスティック型PC",
              value: "stick_pc",
            },
          ],
        },
        {
          text: "主な用途は何ですか？",
          description: "パソコンをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算、メール等",
              value: "office_work",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "ゲーミング",
              description: "PCゲーム",
              value: "gaming",
            },
            {
              label: "動画編集・創作",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "データ分析・AI",
              description: "機械学習、データ分析",
              value: "data_analysis",
            },
            {
              label: "サーバー・ワークステーション",
              description: "サーバー用途、ワークステーション",
              value: "server_workstation",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "パソコンの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5万円以下",
              description: "エントリーモデル",
              value: "budget_under_50k",
            },
            {
              label: "5-15万円",
              description: "ミドルレンジモデル",
              value: "budget_50k_150k",
            },
            {
              label: "15-30万円",
              description: "ハイエンドモデル",
              value: "budget_150k_300k",
            },
            {
              label: "30万円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_300k",
            },
          ],
        },
        {
          text: "持ち運びの頻度は？",
          description: "パソコンの持ち運びについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "毎日持ち運ぶ",
              description: "通勤・通学で毎日使用",
              value: "daily_carry",
            },
            {
              label: "時々持ち運ぶ",
              description: "出張・移動時に使用",
              value: "occasional_carry",
            },
            {
              label: "ほとんど持ち運ばない",
              description: "主に固定場所で使用",
              value: "rarely_carry",
            },
            {
              label: "全く持ち運ばない",
              description: "完全に据え置きで使用",
              value: "never_carry",
            },
          ],
        },
        {
          text: "画面サイズの希望は？",
          description: "パソコンの画面サイズについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "11-13インチ",
              description: "コンパクトサイズ",
              value: "size_11_13inch",
            },
            {
              label: "14-15インチ",
              description: "標準サイズ",
              value: "size_14_15inch",
            },
            {
              label: "16-17インチ",
              description: "大画面サイズ",
              value: "size_16_17inch",
            },
            {
              label: "18インチ以上",
              description: "超大画面",
              value: "size_18inch_plus",
            },
            {
              label: "問わない",
              description: "画面サイズは問わない",
              value: "size_any",
            },
          ],
        },
      ],
    },
    // PCパーツの質問（親カテゴリ）
    {
      categoryName: "PCパーツ",
      questions: [
        {
          text: "どのようなPCパーツをお探しですか？",
          description: "PCパーツの種類について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "内蔵ドライブ・ストレージ",
              description: "SSD・HDD・M.2・内蔵ドライブ",
              value: "storage",
            },
            {
              label: "グラフィックボード",
              description: "GPU・グラフィックカード・ビデオカード",
              value: "graphics_card",
            },
            {
              label: "CPU",
              description: "プロセッサー・中央処理装置",
              value: "cpu",
            },
            {
              label: "増設メモリ",
              description: "RAM・メモリモジュール",
              value: "memory",
            },
            {
              label: "マザーボード",
              description: "メインボード・マザーボード",
              value: "motherboard",
            },
            {
              label: "冷却パーツ",
              description: "CPUクーラー・ケースファン・水冷",
              value: "cooling",
            },
            {
              label: "PCケース・筐体",
              description: "ミドルタワー・フルタワー・ミニITX",
              value: "pc_case",
            },
            {
              label: "PCケース用電源",
              description: "ATX電源・SFX電源・電源ユニット",
              value: "power_supply",
            },
          ],
        },
        {
          text: "主な用途は何ですか？",
          description: "PCパーツをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "PC組み立て・自作",
              description: "新しいPCの組み立て",
              value: "pc_building",
            },
            {
              label: "性能向上・アップグレード",
              description: "既存PCの性能向上",
              value: "upgrade",
            },
            {
              label: "故障・交換",
              description: "故障したパーツの交換",
              value: "replacement",
            },
            {
              label: "サーバー・ワークステーション",
              description: "サーバー・ワークステーション用途",
              value: "server_workstation",
            },
            {
              label: "ゲーミング",
              description: "ゲーム用途の性能向上",
              value: "gaming",
            },
            {
              label: "クリエイティブ作業",
              description: "動画編集・3DCG等の創作作業",
              value: "creative_work",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "PCパーツの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-50,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_50k",
            },
            {
              label: "50,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_50k",
            },
          ],
        },
        {
          text: "PCの用途は？",
          description: "このPCパーツを使用するPCの用途について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "ゲーミング",
              description: "PCゲーム",
              value: "gaming",
            },
            {
              label: "動画編集・創作",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "データ分析・AI",
              description: "機械学習、データ分析",
              value: "data_analysis",
            },
            {
              label: "サーバー・ワークステーション",
              description: "サーバー用途、ワークステーション",
              value: "server_workstation",
            },
          ],
        },
        {
          text: "性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
      ],
    },
    // マウス・キーボード・入力機器の質問（親カテゴリ）
    {
      categoryName: "マウス・キーボード・入力機器",
      questions: [
        {
          text: "どのような入力機器をお探しですか？",
          description: "入力機器の種類について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "マウス",
              description: "有線マウス・ワイヤレスマウス・トラックボール",
              value: "mouse",
            },
            {
              label: "キーボード",
              description: "メカニカル・メンブレン・無線キーボード",
              value: "keyboard",
            },
            {
              label: "ペンタブレット",
              description: "ペンタブレット・液晶タブレット・デジタイザー",
              value: "pen_tablet",
            },
            {
              label: "キーボード・マウスセット",
              description: "キーボードとマウスのセット商品",
              value: "keyboard_mouse_set",
            },
            {
              label: "テンキー",
              description: "外付けテンキー・数値入力パッド",
              value: "ten_key",
            },
          ],
        },
        {
          text: "主な用途は何ですか？",
          description: "入力機器をどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "デザイン・創作",
              description: "イラスト、デザイン、創作活動",
              value: "design_creative",
            },
            {
              label: "動画編集・配信",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "インターネット・ブラウジング",
              description: "Web閲覧、SNS等",
              value: "browsing",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "入力機器の購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-20,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_20k",
            },
            {
              label: "20,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_20k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "入力機器の接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "USBケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス",
              description: "ワイヤレス接続",
              value: "connection_wireless",
            },
            {
              label: "Bluetooth",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "どれでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "プログラマブルボタン",
              description: "カスタマイズ可能なボタン",
              value: "feature_programmable_buttons",
            },
            {
              label: "マクロ機能",
              description: "マクロ機能",
              value: "feature_macro",
            },
            {
              label: "静音設計",
              description: "静音タイプ",
              value: "feature_silent",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "エルゴノミクス",
              description: "人間工学に基づいた設計",
              value: "feature_ergonomic",
            },
          ],
        },
      ],
    },
    // ゲーム用機器の質問（親カテゴリ）
    {
      categoryName: "ゲーム用機器",
      questions: [
        {
          text: "どのようなゲーム用機器をお探しですか？",
          description: "ゲーム用機器の種類について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ゲーミングヘッドセット",
              description: "ゲーム用ヘッドセット・7.1ch対応",
              value: "gaming_headset",
            },
            {
              label: "ゲーミングキーボード",
              description: "ゲーム用キーボード・RGB・メカニカル",
              value: "gaming_keyboard",
            },
            {
              label: "ゲーミングマウス",
              description: "ゲーム用マウス・高DPI・RGB",
              value: "gaming_mouse",
            },
            {
              label: "ゲームパッド",
              description: "コントローラー・ワイヤレスパッド",
              value: "gamepad",
            },
            {
              label: "ジョイスティック",
              description: "アーケードスティック・フライトスティック",
              value: "joystick",
            },
          ],
        },
        {
          text: "プレイするゲームジャンルは？",
          description: "主にプレイするゲームの種類を教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "FPS・TPS",
              description: "ファーストパーソン・サードパーソンシューター",
              value: "fps_tps",
            },
            {
              label: "MOBA・RTS",
              description:
                "マルチプレイヤーオンラインバトルアリーナ・リアルタイムストラテジー",
              value: "moba_rts",
            },
            {
              label: "MMO・RPG",
              description: "マルチプレイヤーオンライン・ロールプレイングゲーム",
              value: "mmo_rpg",
            },
            {
              label: "格闘ゲーム",
              description: "格闘ゲーム",
              value: "fighting_games",
            },
            {
              label: "レーシングゲーム",
              description: "レーシングゲーム",
              value: "racing_games",
            },
            {
              label: "カジュアルゲーム",
              description: "軽いゲーム中心",
              value: "casual_games",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ゲーム用機器の購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_30k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "ゲーム用機器の接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "ケーブル接続で確実性重視",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス（Bluetooth）",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "ワイヤレス（2.4GHz）",
              description: "専用レシーバー接続",
              value: "connection_2_4ghz",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "使用するプラットフォームは？",
          description: "どのプラットフォームで使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "PC（Windows）",
              description: "Windows PC",
              value: "platform_windows",
            },
            {
              label: "PC（Mac）",
              description: "Mac PC",
              value: "platform_mac",
            },
            {
              label: "PlayStation",
              description: "PlayStation 4/5",
              value: "platform_playstation",
            },
            {
              label: "Xbox",
              description: "Xbox One/Series",
              value: "platform_xbox",
            },
            {
              label: "Nintendo Switch",
              description: "Nintendo Switch",
              value: "platform_switch",
            },
            {
              label: "スマートフォン",
              description: "Android・iPhone",
              value: "platform_mobile",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "マクロ機能",
              description: "カスタムマクロ機能",
              value: "feature_macro",
            },
            {
              label: "プロファイル切り替え",
              description: "設定の保存・切り替え",
              value: "feature_profiles",
            },
            {
              label: "振動機能",
              description: "振動フィードバック",
              value: "feature_vibration",
            },
            {
              label: "サラウンド音響",
              description: "7.1ch等のサラウンド音響",
              value: "feature_surround",
            },
            {
              label: "ノイズキャンセリング",
              description: "ノイズキャンセリング機能",
              value: "feature_noise_cancelling",
            },
          ],
        },
      ],
    },
    // バッテリー・充電器の質問（親カテゴリ）
    {
      categoryName: "バッテリー・充電器",
      questions: [
        {
          text: "どのようなバッテリー・充電器をお探しですか？",
          description: "バッテリー・充電器の種類について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "モバイルバッテリー",
              description: "ポータブル充電器・大容量バッテリー",
              value: "mobile_battery",
            },
            {
              label: "AC式充電器",
              description: "コンセント充電器・USB充電器・PD対応",
              value: "ac_charger",
            },
            {
              label: "ワイヤレス充電器",
              description: "Qi充電器・置くだけ充電・MagSafe",
              value: "wireless_charger",
            },
            {
              label: "ソーラーチャージャー",
              description: "太陽光充電器・アウトドア用充電器",
              value: "solar_charger",
            },
            {
              label: "交換用電池パック",
              description: "スマホ・ノートPC用バッテリー交換",
              value: "replacement_battery",
            },
            {
              label: "ケース型バッテリー",
              description: "スマホケース一体型バッテリー",
              value: "case_battery",
            },
            {
              label: "クレードル・ドック",
              description: "充電スタンド・ドッキングステーション",
              value: "cradle_dock",
            },
          ],
        },
        {
          text: "充電したいデバイスは？",
          description: "どのデバイスを充電しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "スマートフォン",
              description: "iPhone、Android",
              value: "device_smartphone",
            },
            {
              label: "タブレット",
              description: "iPad、Androidタブレット",
              value: "device_tablet",
            },
            {
              label: "ノートPC",
              description: "ノートパソコン",
              value: "device_laptop",
            },
            {
              label: "スマートウォッチ",
              description: "Apple Watch、ウェアラブル端末",
              value: "device_smartwatch",
            },
            {
              label: "イヤホン・ヘッドホン",
              description: "AirPods、ワイヤレスイヤホン等",
              value: "device_earphones",
            },
            {
              label: "その他",
              description: "その他のデバイス",
              value: "device_other",
            },
          ],
        },
        {
          text: "主な使用シーンは？",
          description: "バッテリー・充電器をどのような場面で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "日常使用",
              description: "日常的な充電",
              value: "daily_use",
            },
            {
              label: "外出・移動時",
              description: "外出先での充電",
              value: "outdoor_mobile",
            },
            {
              label: "アウトドア・キャンプ",
              description: "キャンプ、ハイキング等",
              value: "outdoor_camping",
            },
            {
              label: "災害時・非常時",
              description: "停電時、災害時",
              value: "emergency",
            },
            {
              label: "旅行・出張",
              description: "旅行、出張時の充電",
              value: "travel",
            },
            {
              label: "車中泊",
              description: "車中泊での使用",
              value: "car_camping",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "バッテリー・充電器の購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-15,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_15k",
            },
            {
              label: "15,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_15k",
            },
          ],
        },
        {
          text: "充電速度の希望は？",
          description: "充電の速度について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "標準充電",
              description: "一般的な充電速度",
              value: "speed_standard",
            },
            {
              label: "高速充電",
              description: "高速充電対応",
              value: "speed_fast",
            },
            {
              label: "最大速度",
              description: "最大限の充電速度",
              value: "speed_max",
            },
            {
              label: "どれでも良い",
              description: "充電速度は問わない",
              value: "speed_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "ワイヤレス充電",
              description: "ワイヤレス充電機能",
              value: "feature_wireless",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "LEDライト",
              description: "ライト機能付き",
              value: "feature_led_light",
            },
            {
              label: "USB-C PD",
              description: "USB-C Power Delivery対応",
              value: "feature_usb_c_pd",
            },
            {
              label: "マルチポート",
              description: "複数デバイス同時充電",
              value: "feature_multi_port",
            },
            {
              label: "折りたたみ式",
              description: "コンパクトに収納可能",
              value: "feature_foldable",
            },
          ],
        },
      ],
    },
    // スマートフォンの質問
    {
      categoryName: "スマートフォン本体",
      questions: [
        {
          text: "主な使用用途は何ですか？",
          description:
            "スマートフォンをどのような場面で使用されることが多いですか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "通話・メール・SNS",
              description: "基本的な連絡手段として使用",
              value: "basic_communication",
            },
            {
              label: "写真・動画撮影",
              description: "カメラ機能を重視した使用",
              value: "camera_focused",
            },
            {
              label: "ゲーム・動画視聴",
              description: "エンターテイメント用途がメイン",
              value: "entertainment",
            },
            {
              label: "ビジネス・仕事",
              description: "仕事での利用が中心",
              value: "business",
            },
            {
              label: "学習・読書",
              description: "電子書籍や学習アプリの利用",
              value: "learning",
            },
            {
              label: "健康管理",
              description: "フィットネス・健康管理アプリの利用",
              value: "health",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "スマートフォンの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3万円以下",
              description: "エントリーモデル",
              value: "budget_under_30k",
            },
            {
              label: "3-5万円",
              description: "ミドルレンジモデル",
              value: "budget_30k_50k",
            },
            {
              label: "5-10万円",
              description: "ハイエンドモデル",
              value: "budget_50k_100k",
            },
            {
              label: "10-15万円",
              description: "フラッグシップモデル",
              value: "budget_100k_150k",
            },
            {
              label: "15万円以上",
              description: "最高峰モデル",
              value: "budget_over_150k",
            },
          ],
        },
        {
          text: "画面サイズの希望は？",
          description: "使いやすさと携帯性のバランスを考慮してお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "6インチ以下",
              description: "片手で操作しやすいコンパクトサイズ",
              value: "screen_under_6inch",
            },
            {
              label: "6-6.5インチ",
              description: "バランスの良い標準サイズ",
              value: "screen_6_6_5inch",
            },
            {
              label: "6.5-7インチ",
              description: "大画面で見やすく操作しやすい",
              value: "screen_6_5_7inch",
            },
            {
              label: "7インチ以上",
              description: "最大限の画面サイズ",
              value: "screen_over_7inch",
            },
          ],
        },
        {
          text: "カメラ性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "ストレージ容量のご希望は？",
          description: "写真や動画の保存量に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "64GB以下",
              description: "基本的な用途に十分",
              value: "storage_64gb",
            },
            {
              label: "128GB",
              description: "一般的な使用に最適",
              value: "storage_128gb",
            },
            {
              label: "256GB",
              description: "写真・動画を多く保存",
              value: "storage_256gb",
            },
            {
              label: "512GB",
              description: "大容量データを扱う",
              value: "storage_512gb",
            },
            {
              label: "1TB以上",
              description: "プロレベルの大容量",
              value: "storage_1tb_plus",
            },
          ],
        },
        {
          text: "バッテリー駆動時間の希望は？",
          description: "1日の使用時間に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1日持てば十分",
              description: "軽度の使用",
              value: "battery_1day",
            },
            {
              label: "1.5日持つ",
              description: "中程度の使用",
              value: "battery_1_5day",
            },
            {
              label: "2日持つ",
              description: "ヘビーな使用",
              value: "battery_2day",
            },
            {
              label: "2日以上",
              description: "最大限の駆動時間",
              value: "battery_over_2day",
            },
          ],
        },
        {
          text: "5G対応の必要性は？",
          description: "高速通信の必要性について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "5G対応は絶対必要",
              value: "5g_required",
            },
            {
              label: "あった方が良い",
              description: "5G対応を希望する",
              value: "5g_preferred",
            },
            {
              label: "不要",
              description: "4Gで十分",
              value: "5g_not_needed",
            },
          ],
        },
        {
          text: "防水性能の希望は？",
          description: "水回りでの使用頻度に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "水に濡れる場面で使用する",
              value: "waterproof_required",
            },
            {
              label: "あった方が良い",
              description: "安心感が欲しい",
              value: "waterproof_preferred",
            },
            {
              label: "不要",
              description: "基本的に屋内で使用",
              value: "waterproof_not_needed",
            },
          ],
        },
      ],
    },
    // ノートPCの質問
    {
      categoryName: "ノートPC",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "ノートPCを主にどのような作業で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "文書作成・表計算",
              description: "Office系ソフトの使用",
              value: "office_work",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "動画編集・デザイン",
              description: "クリエイティブ作業",
              value: "creative_work",
            },
            {
              label: "ゲーム・娯楽",
              description: "PCゲームや動画視聴",
              value: "gaming_entertainment",
            },
            {
              label: "データ分析・AI",
              description: "機械学習、データサイエンス",
              value: "data_science",
            },
            {
              label: "3DCG・CAD",
              description: "3Dモデリング、設計作業",
              value: "3d_cad",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ノートPCの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5万円以下",
              description: "エントリーモデル",
              value: "budget_under_50k",
            },
            {
              label: "5-10万円",
              description: "ミドルレンジモデル",
              value: "budget_50k_100k",
            },
            {
              label: "10-20万円",
              description: "ハイエンドモデル",
              value: "budget_100k_200k",
            },
            {
              label: "20-30万円",
              description: "プロフェッショナルモデル",
              value: "budget_200k_300k",
            },
            {
              label: "30万円以上",
              description: "最高峰モデル",
              value: "budget_over_300k",
            },
          ],
        },
        {
          text: "持ち運びの頻度は？",
          description: "外出先での使用頻度を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ほぼ自宅・オフィスのみ",
              description: "持ち運びはほとんどしない",
              value: "stationary_use",
            },
            {
              label: "週に数回持ち運び",
              description: "時々外出先で使用",
              value: "occasional_portable",
            },
            {
              label: "ほぼ毎日持ち運び",
              description: "常に携帯する必要がある",
              value: "daily_portable",
            },
          ],
        },
        {
          text: "ご希望の画面サイズは？",
          description: "作業効率と携帯性のバランスを考慮してお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "13インチ以下",
              description: "軽量・コンパクト重視",
              value: "screen_13inch_under",
            },
            {
              label: "14-15インチ",
              description: "バランスの良いサイズ",
              value: "screen_14_15inch",
            },
            {
              label: "16-17インチ",
              description: "大画面で作業効率重視",
              value: "screen_16_17inch",
            },
            {
              label: "18インチ以上",
              description: "最大限の画面サイズ",
              value: "screen_18inch_over",
            },
          ],
        },
        {
          text: "CPU性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "メモリ容量の希望は？",
          description: "作業内容に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "8GB",
              description: "基本的な作業に十分",
              value: "memory_8gb",
            },
            {
              label: "16GB",
              description: "一般的な作業に最適",
              value: "memory_16gb",
            },
            {
              label: "32GB",
              description: "高度な作業・マルチタスク",
              value: "memory_32gb",
            },
            {
              label: "64GB以上",
              description: "プロフェッショナル用途",
              value: "memory_64gb_plus",
            },
          ],
        },
        {
          text: "ストレージ容量の希望は？",
          description: "データ保存量に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "256GB以下",
              description: "基本的な用途に十分",
              value: "storage_256gb_under",
            },
            {
              label: "512GB",
              description: "一般的な使用に最適",
              value: "storage_512gb",
            },
            {
              label: "1TB",
              description: "大容量データを扱う",
              value: "storage_1tb",
            },
            {
              label: "2TB以上",
              description: "プロレベルの大容量",
              value: "storage_2tb_plus",
            },
          ],
        },
        {
          text: "グラフィック性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "バッテリー駆動時間の希望は？",
          description: "外出先での使用時間に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3時間以下",
              description: "主にAC電源で使用",
              value: "battery_3h_under",
            },
            {
              label: "3-6時間",
              description: "短時間の外出で使用",
              value: "battery_3_6h",
            },
            {
              label: "6-10時間",
              description: "長時間の外出で使用",
              value: "battery_6_10h",
            },
            {
              label: "10時間以上",
              description: "最大限の駆動時間",
              value: "battery_10h_over",
            },
          ],
        },
        {
          text: "OSの希望は？",
          description: "使用したいオペレーティングシステムを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "Windows",
              description: "Microsoft Windows",
              value: "os_windows",
            },
            {
              label: "macOS",
              description: "Apple macOS",
              value: "os_macos",
            },
            {
              label: "Linux",
              description: "Linux系OS",
              value: "os_linux",
            },
            {
              label: "どれでも良い",
              description: "OSは問わない",
              value: "os_any",
            },
          ],
        },
      ],
    },
    // モバイルバッテリーの質問
    {
      categoryName: "モバイルバッテリー",
      questions: [
        {
          text: "主な使用シーンは？",
          description: "どのような場面でモバイルバッテリーを使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "通勤・通学",
              description: "電車やバスでの移動中",
              value: "commute",
            },
            {
              label: "旅行・出張",
              description: "長時間の外出",
              value: "travel",
            },
            {
              label: "アウトドア",
              description: "キャンプ、ハイキングなど",
              value: "outdoor",
            },
            {
              label: "災害時の備え",
              description: "緊急時のバックアップ",
              value: "emergency",
            },
            {
              label: "仕事・会議",
              description: "長時間の会議や作業",
              value: "work_meeting",
            },
            {
              label: "イベント・コンサート",
              description: "長時間の外出イベント",
              value: "events",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "モバイルバッテリーの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "2,000円以下",
              description: "エントリーモデル",
              value: "budget_under_2k",
            },
            {
              label: "2,000-5,000円",
              description: "ミドルレンジモデル",
              value: "budget_2k_5k",
            },
            {
              label: "5,000-10,000円",
              description: "ハイエンドモデル",
              value: "budget_5k_10k",
            },
            {
              label: "10,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_10k",
            },
          ],
        },
        {
          text: "必要な容量はどのくらいですか？",
          description: "スマートフォンの充電回数で考えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3000mAh以下",
              description: "スマートフォン0.5-1回分",
              value: "capacity_3000mAh_under",
            },
            {
              label: "5000mAh",
              description: "スマートフォン1回分程度",
              value: "capacity_5000mAh",
            },
            {
              label: "10000mAh",
              description: "スマートフォン2-3回分",
              value: "capacity_10000mAh",
            },
            {
              label: "20000mAh",
              description: "スマートフォン4-5回分",
              value: "capacity_20000mAh",
            },
            {
              label: "27000mAh以上",
              description: "大容量、複数デバイス対応",
              value: "capacity_27000mAh_over",
            },
          ],
        },
        {
          text: "充電したいデバイスは？",
          description: "どのデバイスを充電したいですか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "スマートフォンのみ",
              description: "スマートフォン専用",
              value: "device_smartphone_only",
            },
            {
              label: "タブレット",
              description: "iPad等のタブレット端末",
              value: "device_tablet",
            },
            {
              label: "ノートPC",
              description: "ノートパソコン",
              value: "device_laptop",
            },
            {
              label: "複数デバイス",
              description: "複数のデバイスを同時充電",
              value: "device_multiple",
            },
            {
              label: "その他",
              description: "その他のデバイス",
              value: "device_other",
            },
          ],
        },
        {
          text: "充電速度の希望は？",
          description: "どの程度の充電速度を希望しますか？",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "標準充電（5W）",
              description: "基本的な充電速度",
              value: "charge_standard_5w",
            },
            {
              label: "急速充電（18W）",
              description: "高速充電対応",
              value: "charge_fast_18w",
            },
            {
              label: "超急速充電（30W以上）",
              description: "最高速充電対応",
              value: "charge_ultra_fast_30w_plus",
            },
            {
              label: "どれでも良い",
              description: "充電速度は問わない",
              value: "charge_any",
            },
          ],
        },
        {
          text: "出力ポート数の希望は？",
          description: "同時に充電したいデバイス数に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1ポート",
              description: "1つのデバイスのみ",
              value: "ports_1",
            },
            {
              label: "2ポート",
              description: "2つのデバイス",
              value: "ports_2",
            },
            {
              label: "3-4ポート",
              description: "3-4つのデバイス",
              value: "ports_3_4",
            },
            {
              label: "5ポート以上",
              description: "5つ以上のデバイス",
              value: "ports_5_plus",
            },
          ],
        },
        {
          text: "サイズ・重量の希望は？",
          description: "携帯性と容量のバランスを考慮してお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "コンパクト重視",
              description: "小さく軽いものを優先",
              value: "size_compact",
            },
            {
              label: "バランス重視",
              description: "容量とサイズのバランス",
              value: "size_balanced",
            },
            {
              label: "大容量重視",
              description: "容量を最優先",
              value: "size_high_capacity",
            },
            {
              label: "どれでも良い",
              description: "サイズは問わない",
              value: "size_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "ワイヤレス充電",
              description: "ワイヤレス充電機能付き",
              value: "feature_wireless_charging",
            },
            {
              label: "LEDライト",
              description: "懐中電灯機能付き",
              value: "feature_led_light",
            },
            {
              label: "ソーラー充電",
              description: "太陽光で充電可能",
              value: "feature_solar_charging",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "ディスプレイ",
              description: "残量表示機能付き",
              value: "feature_display",
            },
          ],
        },
      ],
    },
    // グラフィックボードの質問
    {
      categoryName: "グラフィックボード",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "グラフィックボードをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "動画編集・配信",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "3DCG・CAD",
              description: "3Dモデリング、設計",
              value: "3d_cad",
            },
            {
              label: "AI・機械学習",
              description: "深層学習、データ処理",
              value: "ai_ml",
            },
            {
              label: "暗号通貨マイニング",
              description: "仮想通貨の採掘",
              value: "crypto_mining",
            },
            {
              label: "科学計算",
              description: "研究・シミュレーション",
              value: "scientific_computing",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "グラフィックボードの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "2万円以下",
              description: "エントリーレベル",
              value: "gpu_budget_under_20k",
            },
            {
              label: "2-5万円",
              description: "ミドルレンジ",
              value: "gpu_budget_20k_50k",
            },
            {
              label: "5-10万円",
              description: "ハイエンド",
              value: "gpu_budget_50k_100k",
            },
            {
              label: "10-20万円",
              description: "フラッグシップ",
              value: "gpu_budget_100k_200k",
            },
            {
              label: "20万円以上",
              description: "最高峰モデル",
              value: "gpu_budget_over_200k",
            },
          ],
        },
        {
          text: "プレイしたい解像度は？",
          description: "ゲームや作業で使用したい解像度を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1080p (Full HD)",
              description: "1920x1080解像度",
              value: "resolution_1080p",
            },
            {
              label: "1440p (2K)",
              description: "2560x1440解像度",
              value: "resolution_1440p",
            },
            {
              label: "4K",
              description: "3840x2160解像度",
              value: "resolution_4k",
            },
            {
              label: "8K以上",
              description: "7680x4320解像度以上",
              value: "resolution_8k_plus",
            },
          ],
        },
        {
          text: "フレームレートの希望は？",
          description: "どの程度の滑らかさを希望しますか？",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "30fps",
              description: "基本的な滑らかさ",
              value: "fps_30",
            },
            {
              label: "60fps",
              description: "滑らかな動き",
              value: "fps_60",
            },
            {
              label: "120fps",
              description: "非常に滑らかな動き",
              value: "fps_120",
            },
            {
              label: "144fps以上",
              description: "最高の滑らかさ",
              value: "fps_144_plus",
            },
          ],
        },
        {
          text: "VR対応の必要性は？",
          description: "VR（バーチャルリアリティ）の使用予定はありますか？",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "VRは絶対必要",
              value: "vr_required",
            },
            {
              label: "あった方が良い",
              description: "VR対応を希望する",
              value: "vr_preferred",
            },
            {
              label: "不要",
              description: "VRは使用しない",
              value: "vr_not_needed",
            },
          ],
        },
        {
          text: "レイトレーシングの必要性は？",
          description: "リアルタイムレイトレーシングの使用予定はありますか？",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "レイトレーシングは絶対必要",
              value: "raytracing_required",
            },
            {
              label: "あった方が良い",
              description: "レイトレーシングを希望する",
              value: "raytracing_preferred",
            },
            {
              label: "不要",
              description: "レイトレーシングは不要",
              value: "raytracing_not_needed",
            },
          ],
        },
        {
          text: "VRAM容量の希望は？",
          description: "グラフィックメモリの容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "4GB以下",
              description: "基本的な用途に十分",
              value: "vram_4gb_under",
            },
            {
              label: "6-8GB",
              description: "一般的なゲームに最適",
              value: "vram_6_8gb",
            },
            {
              label: "10-12GB",
              description: "高解像度・高設定ゲーム",
              value: "vram_10_12gb",
            },
            {
              label: "16GB以上",
              description: "4K・8K・プロ用途",
              value: "vram_16gb_plus",
            },
          ],
        },
        {
          text: "消費電力の制約は？",
          description: "PCの電源容量や消費電力について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "低消費電力（150W以下）",
              description: "省電力重視",
              value: "power_low_150w",
            },
            {
              label: "中消費電力（150-300W）",
              description: "バランス重視",
              value: "power_medium_150_300w",
            },
            {
              label: "高消費電力（300W以上）",
              description: "性能重視",
              value: "power_high_300w_plus",
            },
            {
              label: "制約なし",
              description: "消費電力は問わない",
              value: "power_no_limit",
            },
          ],
        },
        {
          text: "冷却方式の希望は？",
          description: "グラフィックボードの冷却方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ファン冷却",
              description: "一般的なファン冷却",
              value: "cooling_fan",
            },
            {
              label: "水冷",
              description: "水冷システム",
              value: "cooling_water",
            },
            {
              label: "パッシブ冷却",
              description: "ファンレス設計",
              value: "cooling_passive",
            },
            {
              label: "どれでも良い",
              description: "冷却方式は問わない",
              value: "cooling_any",
            },
          ],
        },
        {
          text: "接続端子の希望は？",
          description: "必要な出力端子について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "HDMI",
              description: "HDMI出力",
              value: "port_hdmi",
            },
            {
              label: "DisplayPort",
              description: "DisplayPort出力",
              value: "port_displayport",
            },
            {
              label: "USB-C",
              description: "USB-C出力",
              value: "port_usb_c",
            },
            {
              label: "DVI",
              description: "DVI出力",
              value: "port_dvi",
            },
            {
              label: "VGA",
              description: "VGA出力",
              value: "port_vga",
            },
          ],
        },
      ],
    },
    // デスクトップPCの質問
    {
      categoryName: "デスクトップPC",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "デスクトップPCを主にどのような作業で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "動画編集・配信",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "3DCG・CAD",
              description: "3Dモデリング、設計",
              value: "3d_cad",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "データ分析・AI",
              description: "機械学習、データサイエンス",
              value: "data_science",
            },
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "デスクトップPCの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5万円以下",
              description: "エントリーモデル",
              value: "budget_under_50k",
            },
            {
              label: "5-10万円",
              description: "ミドルレンジモデル",
              value: "budget_50k_100k",
            },
            {
              label: "10-20万円",
              description: "ハイエンドモデル",
              value: "budget_100k_200k",
            },
            {
              label: "20-50万円",
              description: "プロフェッショナルモデル",
              value: "budget_200k_500k",
            },
            {
              label: "50万円以上",
              description: "最高峰モデル",
              value: "budget_over_500k",
            },
          ],
        },
        {
          text: "設置場所の制約はありますか？",
          description: "デスクトップPCの設置環境について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "制約なし",
              description: "十分なスペースがある",
              value: "space_no_limit",
            },
            {
              label: "机の上に置く",
              description: "デスク上での使用",
              value: "space_desk",
            },
            {
              label: "床に置く",
              description: "床置きでの使用",
              value: "space_floor",
            },
            {
              label: "狭いスペース",
              description: "コンパクトなサイズが必要",
              value: "space_compact",
            },
          ],
        },
        {
          text: "CPU性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "グラフィック性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "メモリ容量の希望は？",
          description: "作業内容に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "8GB",
              description: "基本的な作業に十分",
              value: "memory_8gb",
            },
            {
              label: "16GB",
              description: "一般的な作業に最適",
              value: "memory_16gb",
            },
            {
              label: "32GB",
              description: "高度な作業・マルチタスク",
              value: "memory_32gb",
            },
            {
              label: "64GB以上",
              description: "プロフェッショナル用途",
              value: "memory_64gb_plus",
            },
          ],
        },
        {
          text: "ストレージ容量の希望は？",
          description: "データ保存量に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "256GB以下",
              description: "基本的な用途に十分",
              value: "storage_256gb_under",
            },
            {
              label: "512GB",
              description: "一般的な使用に最適",
              value: "storage_512gb",
            },
            {
              label: "1TB",
              description: "大容量データを扱う",
              value: "storage_1tb",
            },
            {
              label: "2TB以上",
              description: "プロレベルの大容量",
              value: "storage_2tb_plus",
            },
          ],
        },
        {
          text: "静音性の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "拡張性の重要度は？",
          description:
            "将来のアップグレード可能性について1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "OSの希望は？",
          description: "使用したいオペレーティングシステムを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "Windows",
              description: "Microsoft Windows",
              value: "os_windows",
            },
            {
              label: "macOS",
              description: "Apple macOS",
              value: "os_macos",
            },
            {
              label: "Linux",
              description: "Linux系OS",
              value: "os_linux",
            },
            {
              label: "どれでも良い",
              description: "OSは問わない",
              value: "os_any",
            },
          ],
        },
      ],
    },
    // ディスプレイの質問
    {
      categoryName: "ディスプレイ",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "ディスプレイをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "動画編集・配信",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "動画視聴",
              description: "映画、動画コンテンツの視聴",
              value: "video_watching",
            },
            {
              label: "デザイン・写真編集",
              description: "グラフィックデザイン、写真編集",
              value: "design_photo",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ディスプレイの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1万円以下",
              description: "エントリーモデル",
              value: "budget_under_10k",
            },
            {
              label: "1-3万円",
              description: "ミドルレンジモデル",
              value: "budget_10k_30k",
            },
            {
              label: "3-8万円",
              description: "ハイエンドモデル",
              value: "budget_30k_80k",
            },
            {
              label: "8-15万円",
              description: "プロフェッショナルモデル",
              value: "budget_80k_150k",
            },
            {
              label: "15万円以上",
              description: "最高峰モデル",
              value: "budget_over_150k",
            },
          ],
        },
        {
          text: "希望する画面サイズは？",
          description: "ディスプレイの画面サイズを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "21-24インチ",
              description: "コンパクトサイズ",
              value: "size_21_24inch",
            },
            {
              label: "25-27インチ",
              description: "標準サイズ",
              value: "size_25_27inch",
            },
            {
              label: "28-32インチ",
              description: "大画面サイズ",
              value: "size_28_32inch",
            },
            {
              label: "34-38インチ",
              description: "ウルトラワイド",
              value: "size_34_38inch",
            },
            {
              label: "40インチ以上",
              description: "超大画面",
              value: "size_40inch_plus",
            },
          ],
        },
        {
          text: "希望する解像度は？",
          description: "ディスプレイの解像度を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1080p (Full HD)",
              description: "1920x1080解像度",
              value: "resolution_1080p",
            },
            {
              label: "1440p (2K)",
              description: "2560x1440解像度",
              value: "resolution_1440p",
            },
            {
              label: "4K",
              description: "3840x2160解像度",
              value: "resolution_4k",
            },
            {
              label: "5K以上",
              description: "5120x2880解像度以上",
              value: "resolution_5k_plus",
            },
          ],
        },
        {
          text: "リフレッシュレートの希望は？",
          description: "画面の更新頻度について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "60Hz",
              description: "標準的な更新頻度",
              value: "refresh_60hz",
            },
            {
              label: "75Hz",
              description: "やや滑らかな表示",
              value: "refresh_75hz",
            },
            {
              label: "120Hz",
              description: "滑らかな表示",
              value: "refresh_120hz",
            },
            {
              label: "144Hz",
              description: "ゲーミング向け高更新頻度",
              value: "refresh_144hz",
            },
            {
              label: "240Hz以上",
              description: "最高の滑らかさ",
              value: "refresh_240hz_plus",
            },
          ],
        },
        {
          text: "接続端子の希望は？",
          description: "必要な入力端子について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "HDMI",
              description: "HDMI入力",
              value: "port_hdmi",
            },
            {
              label: "DisplayPort",
              description: "DisplayPort入力",
              value: "port_displayport",
            },
            {
              label: "USB-C",
              description: "USB-C入力",
              value: "port_usb_c",
            },
            {
              label: "DVI",
              description: "DVI入力",
              value: "port_dvi",
            },
            {
              label: "VGA",
              description: "VGA入力",
              value: "port_vga",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "HDR対応",
              description: "HDR（ハイダイナミックレンジ）対応",
              value: "feature_hdr",
            },
            {
              label: "曲面ディスプレイ",
              description: "カーブドディスプレイ",
              value: "feature_curved",
            },
            {
              label: "タッチパネル",
              description: "タッチ操作対応",
              value: "feature_touch",
            },
            {
              label: "USBハブ機能",
              description: "USBポート付き",
              value: "feature_usb_hub",
            },
            {
              label: "スピーカー内蔵",
              description: "内蔵スピーカー付き",
              value: "feature_speakers",
            },
            {
              label: "Webカメラ内蔵",
              description: "内蔵カメラ付き",
              value: "feature_camera",
            },
          ],
        },
        {
          text: "色域の重要度は？",
          description:
            "色の再現性について1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "視野角の重要度は？",
          description:
            "斜めから見た時の色の変化について1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
      ],
    },
    // キーボードの質問
    {
      categoryName: "キーボード",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "キーボードをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "文書作成・表計算",
              description: "Office系ソフトの使用",
              value: "office_work",
            },
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "動画編集・配信",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "チャット・SNS",
              description: "コミュニケーション",
              value: "chat_sns",
            },
            {
              label: "データ入力",
              description: "大量の文字入力作業",
              value: "data_entry",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "キーボードの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-20,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_20k",
            },
            {
              label: "20,000-50,000円",
              description: "プロフェッショナルモデル",
              value: "budget_20k_50k",
            },
            {
              label: "50,000円以上",
              description: "最高峰モデル",
              value: "budget_over_50k",
            },
          ],
        },
        {
          text: "キーボードの種類は？",
          description: "キーの仕組みについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "メカニカル",
              description: "機械式スイッチ",
              value: "type_mechanical",
            },
            {
              label: "メンブレン",
              description: "ゴムドーム式",
              value: "type_membrane",
            },
            {
              label: "静電容量無接点",
              description: "静電容量式",
              value: "type_capacitive",
            },
            {
              label: "どれでも良い",
              description: "種類は問わない",
              value: "type_any",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "キーボードの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "USBケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス（Bluetooth）",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "ワイヤレス（2.4GHz）",
              description: "専用レシーバー接続",
              value: "connection_2_4ghz",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "キー配列の希望は？",
          description: "キーボードの配列について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "フルサイズ（108キー）",
              description: "テンキー付きフル配列",
              value: "layout_full",
            },
            {
              label: "テンキーレス（87キー）",
              description: "テンキーなしコンパクト",
              value: "layout_tenkeyless",
            },
            {
              label: "75%配列",
              description: "さらにコンパクト",
              value: "layout_75",
            },
            {
              label: "60%配列",
              description: "最小限のキー数",
              value: "layout_60",
            },
            {
              label: "40%配列",
              description: "超コンパクト",
              value: "layout_40",
            },
          ],
        },
        {
          text: "キーキャップの材質の希望は？",
          description: "キーキャップの材質について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ABS",
              description: "一般的なプラスチック",
              value: "keycap_abs",
            },
            {
              label: "PBT",
              description: "高耐久プラスチック",
              value: "keycap_pbt",
            },
            {
              label: "POM",
              description: "高級プラスチック",
              value: "keycap_pom",
            },
            {
              label: "金属",
              description: "メタルキーキャップ",
              value: "keycap_metal",
            },
            {
              label: "どれでも良い",
              description: "材質は問わない",
              value: "keycap_any",
            },
          ],
        },
        {
          text: "バックライトの希望は？",
          description: "キーボードの光る機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "不要",
              description: "バックライトは不要",
              value: "backlight_none",
            },
            {
              label: "単色",
              description: "単色のバックライト",
              value: "backlight_single",
            },
            {
              label: "RGB",
              description: "フルカラーバックライト",
              value: "backlight_rgb",
            },
            {
              label: "どれでも良い",
              description: "バックライトは問わない",
              value: "backlight_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "マクロキー",
              description: "カスタムマクロ機能",
              value: "feature_macro",
            },
            {
              label: "音量調整",
              description: "音量コントロール付き",
              value: "feature_volume",
            },
            {
              label: "USBハブ",
              description: "USBポート付き",
              value: "feature_usb_hub",
            },
            {
              label: "手首置き場",
              description: "パームレスト付き",
              value: "feature_palm_rest",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "静音設計",
              description: "静音タイプ",
              value: "feature_silent",
            },
          ],
        },
        {
          text: "打鍵感の希望は？",
          description: "キーを押した時の感触について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "軽い",
              description: "軽いタッチで入力",
              value: "feel_light",
            },
            {
              label: "中程度",
              description: "バランスの良い打鍵感",
              value: "feel_medium",
            },
            {
              label: "重い",
              description: "しっかりとした打鍵感",
              value: "feel_heavy",
            },
            {
              label: "どれでも良い",
              description: "打鍵感は問わない",
              value: "feel_any",
            },
          ],
        },
      ],
    },
    // タブレットPC本体の質問
    {
      categoryName: "タブレットPC本体",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "タブレットをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "動画視聴・娯楽",
              description: "映画、動画、ゲーム",
              value: "entertainment",
            },
            {
              label: "読書・学習",
              description: "電子書籍、学習アプリ",
              value: "reading_learning",
            },
            {
              label: "仕事・ビジネス",
              description: "会議、プレゼン、文書作成",
              value: "business",
            },
            {
              label: "デザイン・創作",
              description: "イラスト、デザイン、創作活動",
              value: "creative",
            },
            {
              label: "通話・コミュニケーション",
              description: "ビデオ通話、SNS",
              value: "communication",
            },
            {
              label: "子供向け",
              description: "子供の学習・遊び用",
              value: "kids",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "タブレットの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3万円以下",
              description: "エントリーモデル",
              value: "budget_under_30k",
            },
            {
              label: "3-6万円",
              description: "ミドルレンジモデル",
              value: "budget_30k_60k",
            },
            {
              label: "6-10万円",
              description: "ハイエンドモデル",
              value: "budget_60k_100k",
            },
            {
              label: "10-15万円",
              description: "プロフェッショナルモデル",
              value: "budget_100k_150k",
            },
            {
              label: "15万円以上",
              description: "最高峰モデル",
              value: "budget_over_150k",
            },
          ],
        },
        {
          text: "希望する画面サイズは？",
          description: "タブレットの画面サイズを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "7-8インチ",
              description: "コンパクトサイズ",
              value: "size_7_8inch",
            },
            {
              label: "9-10インチ",
              description: "標準サイズ",
              value: "size_9_10inch",
            },
            {
              label: "11-12インチ",
              description: "大画面サイズ",
              value: "size_11_12inch",
            },
            {
              label: "13インチ以上",
              description: "超大画面",
              value: "size_13inch_plus",
            },
          ],
        },
        {
          text: "ストレージ容量の希望は？",
          description: "データ保存量に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "32GB以下",
              description: "基本的な用途に十分",
              value: "storage_32gb_under",
            },
            {
              label: "64GB",
              description: "一般的な使用に最適",
              value: "storage_64gb",
            },
            {
              label: "128GB",
              description: "写真・動画を多く保存",
              value: "storage_128gb",
            },
            {
              label: "256GB以上",
              description: "大容量データを扱う",
              value: "storage_256gb_plus",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "タブレットの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "Wi-Fiのみ",
              description: "Wi-Fi接続のみ",
              value: "connection_wifi_only",
            },
            {
              label: "Wi-Fi + セルラー",
              description: "Wi-Fiとモバイル通信両対応",
              value: "connection_wifi_cellular",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "ペン入力の必要性は？",
          description: "スタイラスペンでの入力について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "ペン入力は絶対必要",
              value: "stylus_required",
            },
            {
              label: "あった方が良い",
              description: "ペン入力機能を希望する",
              value: "stylus_preferred",
            },
            {
              label: "不要",
              description: "ペン入力は不要",
              value: "stylus_not_needed",
            },
          ],
        },
        {
          text: "キーボードの必要性は？",
          description: "外付けキーボードについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "キーボードは絶対必要",
              value: "keyboard_required",
            },
            {
              label: "あった方が良い",
              description: "キーボード機能を希望する",
              value: "keyboard_preferred",
            },
            {
              label: "不要",
              description: "キーボードは不要",
              value: "keyboard_not_needed",
            },
          ],
        },
        {
          text: "カメラ性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "バッテリー駆動時間の希望は？",
          description: "1日の使用時間に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "6時間以下",
              description: "短時間の使用",
              value: "battery_6h_under",
            },
            {
              label: "6-10時間",
              description: "中程度の使用",
              value: "battery_6_10h",
            },
            {
              label: "10-15時間",
              description: "長時間の使用",
              value: "battery_10_15h",
            },
            {
              label: "15時間以上",
              description: "最大限の駆動時間",
              value: "battery_15h_over",
            },
          ],
        },
      ],
    },
    // スマートウォッチ本体の質問
    {
      categoryName: "スマートウォッチ本体",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "スマートウォッチをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "健康管理・フィットネス",
              description: "歩数、心拍数、運動記録",
              value: "health_fitness",
            },
            {
              label: "通知・連絡",
              description: "メール、メッセージ、電話の通知",
              value: "notifications",
            },
            {
              label: "時計・アラーム",
              description: "時間確認、アラーム機能",
              value: "time_alarm",
            },
            {
              label: "音楽・エンターテイメント",
              description: "音楽再生、動画視聴",
              value: "entertainment",
            },
            {
              label: "GPS・ナビゲーション",
              description: "位置情報、ナビ機能",
              value: "gps_navigation",
            },
            {
              label: "ファッション・アクセサリー",
              description: "ファッションアイテムとして",
              value: "fashion",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "スマートウォッチの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1万円以下",
              description: "エントリーモデル",
              value: "budget_under_10k",
            },
            {
              label: "1-3万円",
              description: "ミドルレンジモデル",
              value: "budget_10k_30k",
            },
            {
              label: "3-6万円",
              description: "ハイエンドモデル",
              value: "budget_30k_60k",
            },
            {
              label: "6-10万円",
              description: "プロフェッショナルモデル",
              value: "budget_60k_100k",
            },
            {
              label: "10万円以上",
              description: "最高峰モデル",
              value: "budget_over_100k",
            },
          ],
        },
        {
          text: "希望する画面サイズは？",
          description: "スマートウォッチの画面サイズを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "38mm以下",
              description: "コンパクトサイズ",
              value: "size_38mm_under",
            },
            {
              label: "40-42mm",
              description: "標準サイズ",
              value: "size_40_42mm",
            },
            {
              label: "44-46mm",
              description: "大画面サイズ",
              value: "size_44_46mm",
            },
            {
              label: "48mm以上",
              description: "超大画面",
              value: "size_48mm_plus",
            },
          ],
        },
        {
          text: "バッテリー駆動時間の希望は？",
          description: "充電間隔に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1日",
              description: "毎日充電",
              value: "battery_1day",
            },
            {
              label: "2-3日",
              description: "2-3日に1回充電",
              value: "battery_2_3day",
            },
            {
              label: "1週間",
              description: "週1回充電",
              value: "battery_1week",
            },
            {
              label: "1週間以上",
              description: "長期間の駆動",
              value: "battery_over_1week",
            },
          ],
        },
        {
          text: "防水性能の希望は？",
          description: "水回りでの使用頻度に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "水に濡れる場面で使用する",
              value: "waterproof_required",
            },
            {
              label: "あった方が良い",
              description: "安心感が欲しい",
              value: "waterproof_preferred",
            },
            {
              label: "不要",
              description: "基本的に屋内で使用",
              value: "waterproof_not_needed",
            },
          ],
        },
        {
          text: "GPS機能の必要性は？",
          description: "位置情報機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "GPS機能は絶対必要",
              value: "gps_required",
            },
            {
              label: "あった方が良い",
              description: "GPS機能を希望する",
              value: "gps_preferred",
            },
            {
              label: "不要",
              description: "GPS機能は不要",
              value: "gps_not_needed",
            },
          ],
        },
        {
          text: "心拍数測定の必要性は？",
          description: "健康管理機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "心拍数測定は絶対必要",
              value: "heartrate_required",
            },
            {
              label: "あった方が良い",
              description: "心拍数測定を希望する",
              value: "heartrate_preferred",
            },
            {
              label: "不要",
              description: "心拍数測定は不要",
              value: "heartrate_not_needed",
            },
          ],
        },
        {
          text: "通話機能の必要性は？",
          description: "電話機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "通話機能は絶対必要",
              value: "calling_required",
            },
            {
              label: "あった方が良い",
              description: "通話機能を希望する",
              value: "calling_preferred",
            },
            {
              label: "不要",
              description: "通話機能は不要",
              value: "calling_not_needed",
            },
          ],
        },
        {
          text: "デザインの希望は？",
          description: "外観デザインについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "スポーティ",
              description: "運動向けのデザイン",
              value: "design_sporty",
            },
            {
              label: "エレガント",
              description: "上品で洗練されたデザイン",
              value: "design_elegant",
            },
            {
              label: "カジュアル",
              description: "カジュアルなデザイン",
              value: "design_casual",
            },
            {
              label: "どれでも良い",
              description: "デザインは問わない",
              value: "design_any",
            },
          ],
        },
      ],
    },
    // ヘッドセット・イヤホンマイクの質問
    {
      categoryName: "ヘッドセット・イヤホンマイク",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "ヘッドセット・イヤホンをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "音楽鑑賞",
              description: "音楽を聴く",
              value: "music",
            },
            {
              label: "動画視聴",
              description: "映画、動画の視聴",
              value: "video_watching",
            },
            {
              label: "通話・会議",
              description: "電話、ビデオ会議",
              value: "calling_meeting",
            },
            {
              label: "配信・録音",
              description: "ライブ配信、音声録音",
              value: "streaming_recording",
            },
            {
              label: "運動・フィットネス",
              description: "ジョギング、ジムでの使用",
              value: "fitness",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ヘッドセット・イヤホンの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-20,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_20k",
            },
            {
              label: "20,000-50,000円",
              description: "プロフェッショナルモデル",
              value: "budget_20k_50k",
            },
            {
              label: "50,000円以上",
              description: "最高峰モデル",
              value: "budget_over_50k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "ヘッドセット・イヤホンの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "ケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス（Bluetooth）",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "ワイヤレス（2.4GHz）",
              description: "専用レシーバー接続",
              value: "connection_2_4ghz",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "音質の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "ノイズキャンセリングの必要性は？",
          description: "周囲の音を消す機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "ノイズキャンセリングは絶対必要",
              value: "noise_cancelling_required",
            },
            {
              label: "あった方が良い",
              description: "ノイズキャンセリングを希望する",
              value: "noise_cancelling_preferred",
            },
            {
              label: "不要",
              description: "ノイズキャンセリングは不要",
              value: "noise_cancelling_not_needed",
            },
          ],
        },
        {
          text: "マイク機能の必要性は？",
          description: "音声入力機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "マイク機能は絶対必要",
              value: "microphone_required",
            },
            {
              label: "あった方が良い",
              description: "マイク機能を希望する",
              value: "microphone_preferred",
            },
            {
              label: "不要",
              description: "マイク機能は不要",
              value: "microphone_not_needed",
            },
          ],
        },
        {
          text: "装着感の希望は？",
          description: "ヘッドセット・イヤホンの装着感について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "軽量・快適",
              description: "軽くて長時間使用できる",
              value: "comfort_light",
            },
            {
              label: "しっかり固定",
              description: "しっかりと固定される",
              value: "comfort_secure",
            },
            {
              label: "密着感",
              description: "耳に密着する",
              value: "comfort_tight",
            },
            {
              label: "どれでも良い",
              description: "装着感は問わない",
              value: "comfort_any",
            },
          ],
        },
        {
          text: "バッテリー駆動時間の希望は？",
          description: "ワイヤレス使用時の駆動時間について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5時間以下",
              description: "短時間の使用",
              value: "battery_5h_under",
            },
            {
              label: "5-10時間",
              description: "中程度の使用",
              value: "battery_5_10h",
            },
            {
              label: "10-20時間",
              description: "長時間の使用",
              value: "battery_10_20h",
            },
            {
              label: "20時間以上",
              description: "最大限の駆動時間",
              value: "battery_20h_over",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "7.1chサラウンド",
              description: "7.1chサラウンド音響",
              value: "feature_7_1ch",
            },
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "イコライザー",
              description: "音質調整機能",
              value: "feature_equalizer",
            },
            {
              label: "音声認識",
              description: "音声コマンド対応",
              value: "feature_voice_control",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "折りたたみ",
              description: "コンパクトに収納可能",
              value: "feature_foldable",
            },
          ],
        },
      ],
    },
    // CPUの質問
    {
      categoryName: "CPU",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "CPUをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "動画編集・配信",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "データ分析・AI",
              description: "機械学習、データサイエンス",
              value: "data_science",
            },
            {
              label: "3DCG・CAD",
              description: "3Dモデリング、設計",
              value: "3d_cad",
            },
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "CPUの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1万円以下",
              description: "エントリーレベル",
              value: "budget_under_10k",
            },
            {
              label: "1-3万円",
              description: "ミドルレンジ",
              value: "budget_10k_30k",
            },
            {
              label: "3-6万円",
              description: "ハイエンド",
              value: "budget_30k_60k",
            },
            {
              label: "6-10万円",
              description: "フラッグシップ",
              value: "budget_60k_100k",
            },
            {
              label: "10万円以上",
              description: "最高峰モデル",
              value: "budget_over_100k",
            },
          ],
        },
        {
          text: "コア数の希望は？",
          description: "CPUのコア数について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "4コア以下",
              description: "基本的な用途に十分",
              value: "cores_4_under",
            },
            {
              label: "6コア",
              description: "一般的な作業に最適",
              value: "cores_6",
            },
            {
              label: "8コア",
              description: "高度な作業・マルチタスク",
              value: "cores_8",
            },
            {
              label: "12コア以上",
              description: "プロフェッショナル用途",
              value: "cores_12_plus",
            },
          ],
        },
        {
          text: "クロック周波数の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "消費電力の制約は？",
          description: "PCの電源容量や消費電力について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "低消費電力（65W以下）",
              description: "省電力重視",
              value: "power_low_65w",
            },
            {
              label: "中消費電力（65-105W）",
              description: "バランス重視",
              value: "power_medium_65_105w",
            },
            {
              label: "高消費電力（105W以上）",
              description: "性能重視",
              value: "power_high_105w_plus",
            },
            {
              label: "制約なし",
              description: "消費電力は問わない",
              value: "power_no_limit",
            },
          ],
        },
        {
          text: "オーバークロックの必要性は？",
          description: "CPUのオーバークロックについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "オーバークロックは絶対必要",
              value: "overclock_required",
            },
            {
              label: "あった方が良い",
              description: "オーバークロック機能を希望する",
              value: "overclock_preferred",
            },
            {
              label: "不要",
              description: "オーバークロックは不要",
              value: "overclock_not_needed",
            },
          ],
        },
        {
          text: "内蔵グラフィックの必要性は？",
          description: "CPU内蔵グラフィックについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "内蔵グラフィックは絶対必要",
              value: "igpu_required",
            },
            {
              label: "あった方が良い",
              description: "内蔵グラフィックを希望する",
              value: "igpu_preferred",
            },
            {
              label: "不要",
              description: "内蔵グラフィックは不要",
              value: "igpu_not_needed",
            },
          ],
        },
      ],
    },
    // マウスの質問
    {
      categoryName: "マウス",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "マウスをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "デザイン・創作",
              description: "イラスト、デザイン、創作活動",
              value: "design_creative",
            },
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "動画編集・配信",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "インターネット・ブラウジング",
              description: "Web閲覧、SNS等",
              value: "browsing",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "マウスの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1,000円以下",
              description: "エントリーモデル",
              value: "budget_under_1k",
            },
            {
              label: "1,000-3,000円",
              description: "ミドルレンジモデル",
              value: "budget_1k_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ハイエンドモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-20,000円",
              description: "プロフェッショナルモデル",
              value: "budget_8k_20k",
            },
            {
              label: "20,000円以上",
              description: "最高峰モデル",
              value: "budget_over_20k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "マウスの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "USBケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス（Bluetooth）",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "ワイヤレス（2.4GHz）",
              description: "専用レシーバー接続",
              value: "connection_2_4ghz",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "マウスの持ち方は？",
          description: "普段のマウスの持ち方を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "かぶせ持ち",
              description: "手のひら全体でマウスを包む",
              value: "palm_grip",
            },
            {
              label: "つまみ持ち",
              description: "指先でマウスをつまむ",
              value: "fingertip_grip",
            },
            {
              label: "つかみ持ち",
              description: "手のひらと指先の中間",
              value: "claw_grip",
            },
          ],
        },
        {
          text: "手のサイズは？",
          description: "手の大きさを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "小さい（17cm以下）",
              description: "コンパクトなマウスが適している",
              value: "hand_small",
            },
            {
              label: "中くらい（17-19cm）",
              description: "標準サイズのマウスが適している",
              value: "hand_medium",
            },
            {
              label: "大きい（19cm以上）",
              description: "大型のマウスが適している",
              value: "hand_large",
            },
          ],
        },
        {
          text: "重量の希望は？",
          description: "マウスの重さの好みを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "軽量（80g以下）",
              description: "軽いマウス",
              value: "weight_light_80g",
            },
            {
              label: "標準（80-120g）",
              description: "バランスの良い重量",
              value: "weight_standard_80_120g",
            },
            {
              label: "重め（120g以上）",
              description: "安定感のある重量",
              value: "weight_heavy_120g_plus",
            },
          ],
        },
        {
          text: "DPI設定の希望は？",
          description: "マウスの感度設定について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "低DPI（800-1600）",
              description: "精密な操作重視",
              value: "dpi_low",
            },
            {
              label: "中DPI（1600-3200）",
              description: "バランス重視",
              value: "dpi_medium",
            },
            {
              label: "高DPI（3200-6400）",
              description: "素早い動き重視",
              value: "dpi_high",
            },
            {
              label: "超高DPI（6400以上）",
              description: "最高の感度",
              value: "dpi_ultra_high",
            },
          ],
        },
        {
          text: "ボタン数の希望は？",
          description: "マウスに必要なボタン数について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "最小限（左右クリックのみ）",
              description: "シンプルな操作",
              value: "buttons_minimal",
            },
            {
              label: "標準（5-6ボタン）",
              description: "一般的な操作",
              value: "buttons_standard",
            },
            {
              label: "多機能（7-12ボタン）",
              description: "複雑な操作",
              value: "buttons_multi",
            },
            {
              label: "最大（13ボタン以上）",
              description: "多ボタン操作",
              value: "buttons_maximum",
            },
          ],
        },
      ],
    },
    // AC式充電器の質問
    {
      categoryName: "AC式充電器",
      questions: [
        {
          text: "充電したいデバイスは？",
          description: "どのデバイスを充電したいですか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "スマートフォン",
              description: "iPhone・Android端末",
              value: "device_smartphone",
            },
            {
              label: "タブレット",
              description: "iPad等のタブレット端末",
              value: "device_tablet",
            },
            {
              label: "ノートPC",
              description: "ノートパソコン",
              value: "device_laptop",
            },
            {
              label: "ゲーム機",
              description: "Nintendo Switch等",
              value: "device_gaming",
            },
            {
              label: "その他",
              description: "その他のデバイス",
              value: "device_other",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "AC式充電器の購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1,000円以下",
              description: "エントリーモデル",
              value: "budget_under_1k",
            },
            {
              label: "1,000-3,000円",
              description: "ミドルレンジモデル",
              value: "budget_1k_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ハイエンドモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_8k",
            },
          ],
        },
        {
          text: "出力ポート数の希望は？",
          description: "同時に充電したいデバイス数に応じてお選びください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1ポート",
              description: "1つのデバイスのみ",
              value: "ports_1",
            },
            {
              label: "2ポート",
              description: "2つのデバイス",
              value: "ports_2",
            },
            {
              label: "3-4ポート",
              description: "3-4つのデバイス",
              value: "ports_3_4",
            },
            {
              label: "5ポート以上",
              description: "5つ以上のデバイス",
              value: "ports_5_plus",
            },
          ],
        },
        {
          text: "充電速度の希望は？",
          description: "どの程度の充電速度を希望しますか？",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "標準充電（5W）",
              description: "基本的な充電速度",
              value: "charge_standard_5w",
            },
            {
              label: "急速充電（18W）",
              description: "高速充電対応",
              value: "charge_fast_18w",
            },
            {
              label: "超急速充電（30W以上）",
              description: "最高速充電対応",
              value: "charge_ultra_fast_30w_plus",
            },
            {
              label: "どれでも良い",
              description: "充電速度は問わない",
              value: "charge_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "USB-C PD対応",
              description: "USB-C Power Delivery対応",
              value: "feature_usb_c_pd",
            },
            {
              label: "Qi充電対応",
              description: "ワイヤレス充電機能付き",
              value: "feature_qi_charging",
            },
            {
              label: "折りたたみプラグ",
              description: "コンパクトに収納可能",
              value: "feature_foldable_plug",
            },
            {
              label: "LED表示",
              description: "充電状態表示機能付き",
              value: "feature_led_display",
            },
            {
              label: "過充電保護",
              description: "安全機能付き",
              value: "feature_overcharge_protection",
            },
            {
              label: "海外対応",
              description: "海外で使用可能",
              value: "feature_international",
            },
          ],
        },
      ],
    },
    // ワイヤレス充電器の質問
    {
      categoryName: "ワイヤレス充電器",
      questions: [
        {
          text: "充電したいデバイスは？",
          description: "どのデバイスを充電したいですか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "iPhone",
              description: "Apple iPhone",
              value: "device_iphone",
            },
            {
              label: "Android",
              description: "Android端末",
              value: "device_android",
            },
            {
              label: "AirPods",
              description: "Apple AirPods",
              value: "device_airpods",
            },
            {
              label: "スマートウォッチ",
              description: "Apple Watch等",
              value: "device_smartwatch",
            },
            {
              label: "複数デバイス",
              description: "複数のデバイスを同時充電",
              value: "device_multiple",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ワイヤレス充電器の購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "2,000円以下",
              description: "エントリーモデル",
              value: "budget_under_2k",
            },
            {
              label: "2,000-5,000円",
              description: "ミドルレンジモデル",
              value: "budget_2k_5k",
            },
            {
              label: "5,000-10,000円",
              description: "ハイエンドモデル",
              value: "budget_5k_10k",
            },
            {
              label: "10,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_10k",
            },
          ],
        },
        {
          text: "充電スタンドの希望は？",
          description: "充電器の形状について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "平置きタイプ",
              description: "机に置いて使用",
              value: "stand_flat",
            },
            {
              label: "スタンドタイプ",
              description: "立てて使用",
              value: "stand_vertical",
            },
            {
              label: "マルチスタンド",
              description: "複数デバイス対応",
              value: "stand_multi",
            },
            {
              label: "どれでも良い",
              description: "形状は問わない",
              value: "stand_any",
            },
          ],
        },
        {
          text: "充電速度の希望は？",
          description: "どの程度の充電速度を希望しますか？",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "標準充電（5W）",
              description: "基本的な充電速度",
              value: "charge_standard_5w",
            },
            {
              label: "急速充電（7.5W）",
              description: "高速充電対応",
              value: "charge_fast_7_5w",
            },
            {
              label: "超急速充電（15W以上）",
              description: "最高速充電対応",
              value: "charge_ultra_fast_15w_plus",
            },
            {
              label: "どれでも良い",
              description: "充電速度は問わない",
              value: "charge_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "MagSafe対応",
              description: "iPhone MagSafe対応",
              value: "feature_magsafe",
            },
            {
              label: "LED表示",
              description: "充電状態表示機能付き",
              value: "feature_led_display",
            },
            {
              label: "冷却ファン",
              description: "発熱抑制機能付き",
              value: "feature_cooling_fan",
            },
            {
              label: "角度調整",
              description: "充電角度を調整可能",
              value: "feature_angle_adjustment",
            },
            {
              label: "ケース対応",
              description: "ケース装着時でも充電可能",
              value: "feature_case_compatible",
            },
            {
              label: "自動位置調整",
              description: "最適位置に自動調整",
              value: "feature_auto_positioning",
            },
          ],
        },
      ],
    },
    // ゲーミングマウスの質問
    {
      categoryName: "ゲーミングマウス",
      questions: [
        {
          text: "プレイするゲームジャンルは？",
          description: "主にプレイするゲームの種類を教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "FPS・TPS",
              description: "正確なエイムが重要",
              value: "fps_tps",
            },
            {
              label: "MOBA・RTS",
              description: "多ボタン操作",
              value: "moba_rts",
            },
            {
              label: "MMO・RPG",
              description: "長時間プレイ",
              value: "mmo_rpg",
            },
            {
              label: "カジュアルゲーム",
              description: "軽いゲーム中心",
              value: "casual_games",
            },
            {
              label: "格闘ゲーム",
              description: "精密な操作が重要",
              value: "fighting_games",
            },
            {
              label: "レーシングゲーム",
              description: "滑らかな操作が重要",
              value: "racing_games",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ゲーミングマウスの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-15,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_15k",
            },
            {
              label: "15,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_15k",
            },
          ],
        },
        {
          text: "マウスの持ち方は？",
          description: "普段のマウスの持ち方を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "かぶせ持ち",
              description: "手のひら全体でマウスを包む",
              value: "palm_grip",
            },
            {
              label: "つまみ持ち",
              description: "指先でマウスをつまむ",
              value: "fingertip_grip",
            },
            {
              label: "つかみ持ち",
              description: "手のひらと指先の中間",
              value: "claw_grip",
            },
          ],
        },
        {
          text: "手のサイズは？",
          description: "手の大きさを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "小さい（17cm以下）",
              description: "コンパクトなマウスが適している",
              value: "hand_small",
            },
            {
              label: "中くらい（17-19cm）",
              description: "標準サイズのマウスが適している",
              value: "hand_medium",
            },
            {
              label: "大きい（19cm以上）",
              description: "大型のマウスが適している",
              value: "hand_large",
            },
          ],
        },
        {
          text: "重量の希望は？",
          description: "マウスの重さの好みを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "超軽量（60g以下）",
              description: "最高の機動性",
              value: "ultra_lightweight_60g",
            },
            {
              label: "軽量（60-80g）",
              description: "素早い動きに最適",
              value: "lightweight_60_80g",
            },
            {
              label: "標準（80-100g）",
              description: "バランスの良い重量",
              value: "standard_80_100g",
            },
            {
              label: "重め（100g以上）",
              description: "安定感のある重量",
              value: "heavy_100g_plus",
            },
          ],
        },
        {
          text: "DPI設定の希望は？",
          description: "マウスの感度設定について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "低DPI（800-1600）",
              description: "精密な操作重視",
              value: "dpi_low",
            },
            {
              label: "中DPI（1600-3200）",
              description: "バランス重視",
              value: "dpi_medium",
            },
            {
              label: "高DPI（3200-6400）",
              description: "素早い動き重視",
              value: "dpi_high",
            },
            {
              label: "超高DPI（6400以上）",
              description: "最高の感度",
              value: "dpi_ultra_high",
            },
          ],
        },
        {
          text: "ボタン数の希望は？",
          description: "マウスに必要なボタン数について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "最小限（左右クリックのみ）",
              description: "シンプルな操作",
              value: "buttons_minimal",
            },
            {
              label: "標準（5-6ボタン）",
              description: "一般的なゲーム操作",
              value: "buttons_standard",
            },
            {
              label: "多機能（7-12ボタン）",
              description: "複雑なゲーム操作",
              value: "buttons_multi",
            },
            {
              label: "最大（13ボタン以上）",
              description: "MMO・RTS等の多ボタン操作",
              value: "buttons_maximum",
            },
          ],
        },
        {
          text: "RGBライティングの希望は？",
          description: "マウスの光る機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "RGBライティングは絶対必要",
              value: "rgb_required",
            },
            {
              label: "あった方が良い",
              description: "RGBライティングを希望する",
              value: "rgb_preferred",
            },
            {
              label: "不要",
              description: "光る機能は不要",
              value: "rgb_not_needed",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "マウスの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "ケーブル接続で確実性重視",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス",
              description: "コードレスで自由度重視",
              value: "connection_wireless",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
      ],
    },
    // ゲーミングキーボードの質問
    {
      categoryName: "ゲーミングキーボード",
      questions: [
        {
          text: "プレイするゲームジャンルは？",
          description: "主にプレイするゲームの種類を教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "FPS・TPS",
              description: "正確な操作が重要",
              value: "fps_tps",
            },
            {
              label: "MOBA・RTS",
              description: "多ボタン操作",
              value: "moba_rts",
            },
            {
              label: "MMO・RPG",
              description: "長時間プレイ",
              value: "mmo_rpg",
            },
            {
              label: "格闘ゲーム",
              description: "精密な操作が重要",
              value: "fighting_games",
            },
            {
              label: "レーシングゲーム",
              description: "滑らかな操作が重要",
              value: "racing_games",
            },
            {
              label: "カジュアルゲーム",
              description: "軽いゲーム中心",
              value: "casual_games",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ゲーミングキーボードの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000-50,000円",
              description: "プロフェッショナルモデル",
              value: "budget_30k_50k",
            },
            {
              label: "50,000円以上",
              description: "最高峰モデル",
              value: "budget_over_50k",
            },
          ],
        },
        {
          text: "スイッチの種類は？",
          description: "メカニカルスイッチの種類について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "青軸（クリッキー）",
              description: "カチカチ音がする",
              value: "switch_blue",
            },
            {
              label: "赤軸（リニア）",
              description: "滑らかな押下感",
              value: "switch_red",
            },
            {
              label: "茶軸（タクタイル）",
              description: "軽いクリック感",
              value: "switch_brown",
            },
            {
              label: "黒軸（リニア重）",
              description: "重い押下感",
              value: "switch_black",
            },
            {
              label: "銀軸（リニア軽）",
              description: "軽い押下感",
              value: "switch_silver",
            },
            {
              label: "どれでも良い",
              description: "スイッチは問わない",
              value: "switch_any",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "キーボードの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "USBケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス（Bluetooth）",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "ワイヤレス（2.4GHz）",
              description: "専用レシーバー接続",
              value: "connection_2_4ghz",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "キー配列の希望は？",
          description: "キーボードの配列について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "フルサイズ（108キー）",
              description: "テンキー付きフル配列",
              value: "layout_full",
            },
            {
              label: "テンキーレス（87キー）",
              description: "テンキーなしコンパクト",
              value: "layout_tenkeyless",
            },
            {
              label: "75%配列",
              description: "さらにコンパクト",
              value: "layout_75",
            },
            {
              label: "60%配列",
              description: "最小限のキー数",
              value: "layout_60",
            },
          ],
        },
        {
          text: "RGBライティングの希望は？",
          description: "キーボードの光る機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "RGBライティングは絶対必要",
              value: "rgb_required",
            },
            {
              label: "あった方が良い",
              description: "RGBライティングを希望する",
              value: "rgb_preferred",
            },
            {
              label: "不要",
              description: "光る機能は不要",
              value: "rgb_not_needed",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "マクロキー",
              description: "カスタムマクロ機能",
              value: "feature_macro",
            },
            {
              label: "音量調整",
              description: "音量コントロール付き",
              value: "feature_volume",
            },
            {
              label: "USBハブ",
              description: "USBポート付き",
              value: "feature_usb_hub",
            },
            {
              label: "手首置き場",
              description: "パームレスト付き",
              value: "feature_palm_rest",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "静音設計",
              description: "静音タイプ",
              value: "feature_silent",
            },
          ],
        },
      ],
    },
    // ゲーミングヘッドセットの質問
    {
      categoryName: "ゲーミングヘッドセット",
      questions: [
        {
          text: "プレイするゲームジャンルは？",
          description: "主にプレイするゲームの種類を教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "FPS・TPS",
              description: "正確な音声定位が重要",
              value: "fps_tps",
            },
            {
              label: "MOBA・RTS",
              description: "チーム戦術・音声チャット",
              value: "moba_rts",
            },
            {
              label: "MMO・RPG",
              description: "長時間プレイ・没入感",
              value: "mmo_rpg",
            },
            {
              label: "格闘ゲーム",
              description: "精密な音声フィードバック",
              value: "fighting_games",
            },
            {
              label: "レーシングゲーム",
              description: "エンジン音・環境音",
              value: "racing_games",
            },
            {
              label: "カジュアルゲーム",
              description: "軽いゲーム中心",
              value: "casual_games",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ゲーミングヘッドセットの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_30k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "ヘッドセットの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "ケーブル接続で確実性重視",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス（Bluetooth）",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "ワイヤレス（2.4GHz）",
              description: "専用レシーバー接続",
              value: "connection_2_4ghz",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "音質の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "マイク性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "サラウンド音響の必要性は？",
          description: "7.1ch等のサラウンド音響について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "サラウンド音響は絶対必要",
              value: "surround_required",
            },
            {
              label: "あった方が良い",
              description: "サラウンド音響を希望する",
              value: "surround_preferred",
            },
            {
              label: "不要",
              description: "サラウンド音響は不要",
              value: "surround_not_needed",
            },
          ],
        },
        {
          text: "ノイズキャンセリングの必要性は？",
          description: "周囲の音を消す機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "ノイズキャンセリングは絶対必要",
              value: "noise_cancelling_required",
            },
            {
              label: "あった方が良い",
              description: "ノイズキャンセリングを希望する",
              value: "noise_cancelling_preferred",
            },
            {
              label: "不要",
              description: "ノイズキャンセリングは不要",
              value: "noise_cancelling_not_needed",
            },
          ],
        },
        {
          text: "装着感の希望は？",
          description: "ヘッドセットの装着感について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "軽量・快適",
              description: "軽くて長時間使用できる",
              value: "comfort_light",
            },
            {
              label: "しっかり固定",
              description: "しっかりと固定される",
              value: "comfort_secure",
            },
            {
              label: "密着感",
              description: "耳に密着する",
              value: "comfort_tight",
            },
            {
              label: "どれでも良い",
              description: "装着感は問わない",
              value: "comfort_any",
            },
          ],
        },
        {
          text: "バッテリー駆動時間の希望は？",
          description: "ワイヤレス使用時の駆動時間について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5時間以下",
              description: "短時間の使用",
              value: "battery_5h_under",
            },
            {
              label: "5-10時間",
              description: "中程度の使用",
              value: "battery_5_10h",
            },
            {
              label: "10-20時間",
              description: "長時間の使用",
              value: "battery_10_20h",
            },
            {
              label: "20時間以上",
              description: "最大限の駆動時間",
              value: "battery_20h_over",
            },
          ],
        },
      ],
    },
    // ゲームパッドの質問
    {
      categoryName: "ゲームパッド",
      questions: [
        {
          text: "プレイするゲームジャンルは？",
          description: "主にプレイするゲームの種類を教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "アクション・アドベンチャー",
              description: "3Dアクション、オープンワールド",
              value: "action_adventure",
            },
            {
              label: "レーシング",
              description: "レーシングゲーム",
              value: "racing",
            },
            {
              label: "格闘ゲーム",
              description: "格闘ゲーム",
              value: "fighting",
            },
            {
              label: "スポーツ",
              description: "スポーツゲーム",
              value: "sports",
            },
            {
              label: "プラットフォーマー",
              description: "2D・3Dプラットフォーマー",
              value: "platformer",
            },
            {
              label: "パズル・カジュアル",
              description: "パズル、カジュアルゲーム",
              value: "puzzle_casual",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ゲームパッドの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-15,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_15k",
            },
            {
              label: "15,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_15k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "ゲームパッドの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "USBケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス（Bluetooth）",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "ワイヤレス（2.4GHz）",
              description: "専用レシーバー接続",
              value: "connection_2_4ghz",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "使用するプラットフォームは？",
          description: "どのプラットフォームで使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "PC（Windows）",
              description: "Windows PC",
              value: "platform_windows",
            },
            {
              label: "PC（Mac）",
              description: "Mac PC",
              value: "platform_mac",
            },
            {
              label: "PlayStation",
              description: "PlayStation 4/5",
              value: "platform_playstation",
            },
            {
              label: "Xbox",
              description: "Xbox One/Series",
              value: "platform_xbox",
            },
            {
              label: "Nintendo Switch",
              description: "Nintendo Switch",
              value: "platform_switch",
            },
            {
              label: "スマートフォン",
              description: "Android・iPhone",
              value: "platform_mobile",
            },
          ],
        },
        {
          text: "振動機能の必要性は？",
          description: "コントローラーの振動機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "振動機能は絶対必要",
              value: "vibration_required",
            },
            {
              label: "あった方が良い",
              description: "振動機能を希望する",
              value: "vibration_preferred",
            },
            {
              label: "不要",
              description: "振動機能は不要",
              value: "vibration_not_needed",
            },
          ],
        },
        {
          text: "バッテリー駆動時間の希望は？",
          description: "ワイヤレス使用時の駆動時間について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5時間以下",
              description: "短時間の使用",
              value: "battery_5h_under",
            },
            {
              label: "5-10時間",
              description: "中程度の使用",
              value: "battery_5_10h",
            },
            {
              label: "10-20時間",
              description: "長時間の使用",
              value: "battery_10_20h",
            },
            {
              label: "20時間以上",
              description: "最大限の駆動時間",
              value: "battery_20h_over",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "バックボタン",
              description: "背面に追加ボタン",
              value: "feature_back_buttons",
            },
            {
              label: "トリガーストップ",
              description: "トリガーの可変抵抗",
              value: "feature_trigger_stops",
            },
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "マクロ機能",
              description: "カスタムマクロ機能",
              value: "feature_macro",
            },
            {
              label: "プロファイル切り替え",
              description: "設定の保存・切り替え",
              value: "feature_profiles",
            },
            {
              label: "有線・無線両対応",
              description: "有線と無線の両方に対応",
              value: "feature_hybrid",
            },
          ],
        },
      ],
    },
    // ジョイスティックの質問
    {
      categoryName: "ジョイスティック",
      questions: [
        {
          text: "プレイするゲームジャンルは？",
          description: "主にプレイするゲームの種類を教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "フライトシミュレーター",
              description: "飛行機・ヘリコプターの操縦",
              value: "flight_simulator",
            },
            {
              label: "レーシング",
              description: "レーシングゲーム",
              value: "racing",
            },
            {
              label: "格闘ゲーム",
              description: "アーケード格闘ゲーム",
              value: "fighting",
            },
            {
              label: "シューティング",
              description: "シューティングゲーム",
              value: "shooting",
            },
            {
              label: "パズル・テトリス",
              description: "パズルゲーム",
              value: "puzzle",
            },
            {
              label: "その他",
              description: "その他のゲーム",
              value: "other",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ジョイスティックの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_30k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "ジョイスティックの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "USBケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス（Bluetooth）",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "ワイヤレス（2.4GHz）",
              description: "専用レシーバー接続",
              value: "connection_2_4ghz",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "使用するプラットフォームは？",
          description: "どのプラットフォームで使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "PC（Windows）",
              description: "Windows PC",
              value: "platform_windows",
            },
            {
              label: "PC（Mac）",
              description: "Mac PC",
              value: "platform_mac",
            },
            {
              label: "PlayStation",
              description: "PlayStation 4/5",
              value: "platform_playstation",
            },
            {
              label: "Xbox",
              description: "Xbox One/Series",
              value: "platform_xbox",
            },
            {
              label: "Nintendo Switch",
              description: "Nintendo Switch",
              value: "platform_switch",
            },
            {
              label: "アーケード基板",
              description: "アーケードゲーム基板",
              value: "platform_arcade",
            },
          ],
        },
        {
          text: "ボタン数の希望は？",
          description: "ジョイスティックに必要なボタン数について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "最小限（4ボタン）",
              description: "基本的な操作のみ",
              value: "buttons_4",
            },
            {
              label: "標準（6-8ボタン）",
              description: "一般的なゲーム操作",
              value: "buttons_6_8",
            },
            {
              label: "多機能（10-12ボタン）",
              description: "複雑なゲーム操作",
              value: "buttons_10_12",
            },
            {
              label: "最大（14ボタン以上）",
              description: "プロフェッショナル用途",
              value: "buttons_14_plus",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "マクロ機能",
              description: "カスタムマクロ機能",
              value: "feature_macro",
            },
            {
              label: "プロファイル切り替え",
              description: "設定の保存・切り替え",
              value: "feature_profiles",
            },
            {
              label: "ターボ機能",
              description: "連射機能",
              value: "feature_turbo",
            },
            {
              label: "ソフトウェア対応",
              description: "専用ソフトウェア対応",
              value: "feature_software",
            },
            {
              label: "カスタマイズ可能",
              description: "ボタン配置の変更可能",
              value: "feature_customizable",
            },
          ],
        },
      ],
    },
    // ペンタブレットの質問
    {
      categoryName: "ペンタブレット",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "ペンタブレットをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "イラスト・デザイン",
              description: "イラスト、グラフィックデザイン",
              value: "illustration_design",
            },
            {
              label: "写真編集",
              description: "写真のレタッチ、加工",
              value: "photo_editing",
            },
            {
              label: "3DCG・CAD",
              description: "3Dモデリング、設計",
              value: "3d_cad",
            },
            {
              label: "動画編集",
              description: "動画の編集、エフェクト",
              value: "video_editing",
            },
            {
              label: "手書きメモ",
              description: "デジタル手書きメモ",
              value: "handwriting_notes",
            },
            {
              label: "アニメーション",
              description: "アニメーション制作",
              value: "animation",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ペンタブレットの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-50,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_50k",
            },
            {
              label: "50,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_50k",
            },
          ],
        },
        {
          text: "画面の有無は？",
          description: "ペンタブレットの画面について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "画面付き",
              description: "液晶タブレット",
              value: "with_screen",
            },
            {
              label: "画面なし",
              description: "一般的なペンタブレット",
              value: "without_screen",
            },
            {
              label: "どちらでも良い",
              description: "画面の有無は問わない",
              value: "any",
            },
          ],
        },
        {
          text: "画面サイズの希望は？",
          description: "ペンタブレットの画面サイズを教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "6-8インチ",
              description: "コンパクトサイズ",
              value: "size_6_8inch",
            },
            {
              label: "10-13インチ",
              description: "標準サイズ",
              value: "size_10_13inch",
            },
            {
              label: "15-17インチ",
              description: "大画面サイズ",
              value: "size_15_17inch",
            },
            {
              label: "20インチ以上",
              description: "超大画面",
              value: "size_20inch_plus",
            },
          ],
        },
        {
          text: "ペン圧感度の希望は？",
          description: "ペンの筆圧検知レベルについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1024レベル",
              description: "基本的な筆圧検知",
              value: "pressure_1024",
            },
            {
              label: "2048レベル",
              description: "一般的な筆圧検知",
              value: "pressure_2048",
            },
            {
              label: "4096レベル",
              description: "高精度な筆圧検知",
              value: "pressure_4096",
            },
            {
              label: "8192レベル以上",
              description: "最高精度の筆圧検知",
              value: "pressure_8192_plus",
            },
          ],
        },
        {
          text: "傾き検知の必要性は？",
          description: "ペンの傾きを検知する機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "傾き検知は絶対必要",
              value: "tilt_required",
            },
            {
              label: "あった方が良い",
              description: "傾き検知を希望する",
              value: "tilt_preferred",
            },
            {
              label: "不要",
              description: "傾き検知は不要",
              value: "tilt_not_needed",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "ペンタブレットの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "USB",
              description: "USBケーブル接続",
              value: "connection_usb",
            },
            {
              label: "ワイヤレス",
              description: "ワイヤレス接続",
              value: "connection_wireless",
            },
            {
              label: "Bluetooth",
              description: "Bluetooth接続",
              value: "connection_bluetooth",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
      ],
    },
    // キーボード・マウスセットの質問
    {
      categoryName: "キーボード・マウスセット",
      questions: [
        {
          text: "主な用途は何ですか？",
          description:
            "キーボード・マウスセットをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "ゲーミング",
              description: "PCゲームでの使用",
              value: "gaming",
            },
            {
              label: "デザイン・創作",
              description: "イラスト、デザイン、創作活動",
              value: "design_creative",
            },
            {
              label: "動画編集・配信",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "インターネット・ブラウジング",
              description: "Web閲覧、SNS等",
              value: "browsing",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "キーボード・マウスセットの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-20,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_20k",
            },
            {
              label: "20,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_20k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "セットの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "USBケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス",
              description: "ワイヤレス接続",
              value: "connection_wireless",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "キーボードの種類は？",
          description: "キーボードの仕組みについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "メカニカル",
              description: "機械式スイッチ",
              value: "type_mechanical",
            },
            {
              label: "メンブレン",
              description: "ゴムドーム式",
              value: "type_membrane",
            },
            {
              label: "どれでも良い",
              description: "種類は問わない",
              value: "type_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "音量調整",
              description: "音量コントロール付き",
              value: "feature_volume",
            },
            {
              label: "USBハブ",
              description: "USBポート付き",
              value: "feature_usb_hub",
            },
            {
              label: "手首置き場",
              description: "パームレスト付き",
              value: "feature_palm_rest",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "静音設計",
              description: "静音タイプ",
              value: "feature_silent",
            },
          ],
        },
      ],
    },
    // テンキーの質問
    {
      categoryName: "テンキー",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "テンキーをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "数値入力",
              description: "数字の大量入力",
              value: "numeric_input",
            },
            {
              label: "会計・経理",
              description: "会計ソフトでの使用",
              value: "accounting",
            },
            {
              label: "プログラミング",
              description: "コーディングでの使用",
              value: "programming",
            },
            {
              label: "ゲーミング",
              description: "ゲームでの数値入力",
              value: "gaming",
            },
            {
              label: "データ入力",
              description: "表計算、データベース",
              value: "data_entry",
            },
            {
              label: "その他",
              description: "その他の用途",
              value: "other",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "テンキーの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "2,000円以下",
              description: "エントリーモデル",
              value: "budget_under_2k",
            },
            {
              label: "2,000-5,000円",
              description: "ミドルレンジモデル",
              value: "budget_2k_5k",
            },
            {
              label: "5,000-10,000円",
              description: "ハイエンドモデル",
              value: "budget_5k_10k",
            },
            {
              label: "10,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_10k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "テンキーの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線",
              description: "USBケーブル接続",
              value: "connection_wired",
            },
            {
              label: "ワイヤレス",
              description: "ワイヤレス接続",
              value: "connection_wireless",
            },
            {
              label: "どちらでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "キーボードの種類は？",
          description: "テンキーの仕組みについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "メカニカル",
              description: "機械式スイッチ",
              value: "type_mechanical",
            },
            {
              label: "メンブレン",
              description: "ゴムドーム式",
              value: "type_membrane",
            },
            {
              label: "どれでも良い",
              description: "種類は問わない",
              value: "type_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "計算機能",
              description: "電卓機能付き",
              value: "feature_calculator",
            },
            {
              label: "USBハブ",
              description: "USBポート付き",
              value: "feature_usb_hub",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "静音設計",
              description: "静音タイプ",
              value: "feature_silent",
            },
          ],
        },
      ],
    },
    // 内蔵ドライブ・ストレージの質問
    {
      categoryName: "内蔵ドライブ・ストレージ",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "ストレージをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "OS・アプリケーション",
              description: "システムドライブ",
              value: "os_applications",
            },
            {
              label: "データ保存",
              description: "ファイル、写真、動画保存",
              value: "data_storage",
            },
            {
              label: "ゲーム",
              description: "ゲームデータ保存",
              value: "gaming",
            },
            {
              label: "動画編集・創作",
              description: "大容量ファイル処理",
              value: "video_editing",
            },
            {
              label: "サーバー・NAS",
              description: "サーバー用途",
              value: "server_nas",
            },
            {
              label: "バックアップ",
              description: "データバックアップ",
              value: "backup",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ストレージの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-50,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_50k",
            },
            {
              label: "50,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_50k",
            },
          ],
        },
        {
          text: "ストレージタイプの希望は？",
          description: "ストレージの種類について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "SSD（SATA）",
              description: "SATA接続SSD",
              value: "ssd_sata",
            },
            {
              label: "SSD（M.2 SATA）",
              description: "M.2 SATA SSD",
              value: "ssd_m2_sata",
            },
            {
              label: "SSD（M.2 NVMe）",
              description: "M.2 NVMe SSD",
              value: "ssd_m2_nvme",
            },
            {
              label: "HDD",
              description: "ハードディスクドライブ",
              value: "hdd",
            },
            {
              label: "どれでも良い",
              description: "種類は問わない",
              value: "any",
            },
          ],
        },
        {
          text: "容量の希望は？",
          description: "ストレージの容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "250GB以下",
              description: "小容量",
              value: "capacity_250gb_under",
            },
            {
              label: "250GB-500GB",
              description: "中容量",
              value: "capacity_250_500gb",
            },
            {
              label: "500GB-1TB",
              description: "大容量",
              value: "capacity_500gb_1tb",
            },
            {
              label: "1TB-2TB",
              description: "超大容量",
              value: "capacity_1_2tb",
            },
            {
              label: "2TB以上",
              description: "最大容量",
              value: "capacity_2tb_over",
            },
          ],
        },
        {
          text: "速度の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "信頼性の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
      ],
    },
    // 増設メモリの質問
    {
      categoryName: "増設メモリ",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "メモリをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "ゲーミング",
              description: "PCゲーム",
              value: "gaming",
            },
            {
              label: "動画編集・創作",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "データ分析・AI",
              description: "機械学習、データ分析",
              value: "data_analysis",
            },
            {
              label: "サーバー・仮想化",
              description: "サーバー用途、仮想マシン",
              value: "server_virtualization",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "メモリの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_30k",
            },
          ],
        },
        {
          text: "容量の希望は？",
          description: "メモリの容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "8GB",
              description: "基本容量",
              value: "capacity_8gb",
            },
            {
              label: "16GB",
              description: "標準容量",
              value: "capacity_16gb",
            },
            {
              label: "32GB",
              description: "大容量",
              value: "capacity_32gb",
            },
            {
              label: "64GB以上",
              description: "超大容量",
              value: "capacity_64gb_plus",
            },
          ],
        },
        {
          text: "メモリタイプの希望は？",
          description: "メモリの種類について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "DDR4",
              description: "DDR4メモリ",
              value: "type_ddr4",
            },
            {
              label: "DDR5",
              description: "DDR5メモリ",
              value: "type_ddr5",
            },
            {
              label: "どちらでも良い",
              description: "種類は問わない",
              value: "type_any",
            },
          ],
        },
        {
          text: "速度の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "オーバークロックの必要性は？",
          description: "メモリのオーバークロックについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "オーバークロックは絶対必要",
              value: "overclock_required",
            },
            {
              label: "あった方が良い",
              description: "オーバークロックを希望する",
              value: "overclock_preferred",
            },
            {
              label: "不要",
              description: "オーバークロックは不要",
              value: "overclock_not_needed",
            },
          ],
        },
      ],
    },
    // マザーボードの質問
    {
      categoryName: "マザーボード",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "マザーボードをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "プログラミング・開発",
              description: "コーディング、システム開発",
              value: "programming",
            },
            {
              label: "ゲーミング",
              description: "PCゲーム",
              value: "gaming",
            },
            {
              label: "動画編集・創作",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "データ分析・AI",
              description: "機械学習、データ分析",
              value: "data_analysis",
            },
            {
              label: "サーバー・ワークステーション",
              description: "サーバー用途、ワークステーション",
              value: "server_workstation",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "マザーボードの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "10,000円以下",
              description: "エントリーモデル",
              value: "budget_under_10k",
            },
            {
              label: "10,000-25,000円",
              description: "ミドルレンジモデル",
              value: "budget_10k_25k",
            },
            {
              label: "25,000-50,000円",
              description: "ハイエンドモデル",
              value: "budget_25k_50k",
            },
            {
              label: "50,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_50k",
            },
          ],
        },
        {
          text: "CPUソケットの希望は？",
          description: "対応するCPUソケットについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "LGA1700",
              description: "Intel 12th/13th/14th Gen",
              value: "socket_lga1700",
            },
            {
              label: "AM4",
              description: "AMD Ryzen 3000/4000/5000シリーズ",
              value: "socket_am4",
            },
            {
              label: "AM5",
              description: "AMD Ryzen 7000シリーズ以降",
              value: "socket_am5",
            },
            {
              label: "どれでも良い",
              description: "ソケットは問わない",
              value: "socket_any",
            },
          ],
        },
        {
          text: "フォームファクターの希望は？",
          description: "マザーボードのサイズについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "Mini-ITX",
              description: "超小型",
              value: "form_mini_itx",
            },
            {
              label: "Micro-ATX",
              description: "小型",
              value: "form_micro_atx",
            },
            {
              label: "ATX",
              description: "標準サイズ",
              value: "form_atx",
            },
            {
              label: "E-ATX",
              description: "大型",
              value: "form_e_atx",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "Wi-Fi",
              description: "Wi-Fi機能付き",
              value: "feature_wifi",
            },
            {
              label: "Bluetooth",
              description: "Bluetooth機能付き",
              value: "feature_bluetooth",
            },
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "オーバークロック対応",
              description: "オーバークロック機能",
              value: "feature_overclock",
            },
            {
              label: "USB-C",
              description: "USB-Cポート",
              value: "feature_usb_c",
            },
            {
              label: "Thunderbolt",
              description: "Thunderbolt対応",
              value: "feature_thunderbolt",
            },
          ],
        },
      ],
    },
    // 冷却パーツの質問
    {
      categoryName: "冷却パーツ",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "冷却パーツをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "CPUクーラー",
              description: "CPUの冷却",
              value: "cpu_cooler",
            },
            {
              label: "ケースファン",
              description: "PCケース内の空気循環",
              value: "case_fan",
            },
            {
              label: "水冷システム",
              description: "水冷による冷却",
              value: "water_cooling",
            },
            {
              label: "GPUクーラー",
              description: "グラフィックボードの冷却",
              value: "gpu_cooler",
            },
            {
              label: "静音化",
              description: "PCの静音化",
              value: "silent_cooling",
            },
            {
              label: "オーバークロック",
              description: "オーバークロック時の冷却",
              value: "overclock_cooling",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "冷却パーツの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-10,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_10k",
            },
            {
              label: "10,000-25,000円",
              description: "ハイエンドモデル",
              value: "budget_10k_25k",
            },
            {
              label: "25,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_25k",
            },
          ],
        },
        {
          text: "冷却方式の希望は？",
          description: "冷却の方式について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "空冷",
              description: "ファンによる空冷",
              value: "air_cooling",
            },
            {
              label: "水冷",
              description: "水冷システム",
              value: "water_cooling",
            },
            {
              label: "どちらでも良い",
              description: "冷却方式は問わない",
              value: "any",
            },
          ],
        },
        {
          text: "静音性の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "冷却性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "RGBライティングの希望は？",
          description: "光る機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "RGBライティングは絶対必要",
              value: "rgb_required",
            },
            {
              label: "あった方が良い",
              description: "RGBライティングを希望する",
              value: "rgb_preferred",
            },
            {
              label: "不要",
              description: "RGBライティングは不要",
              value: "rgb_not_needed",
            },
          ],
        },
      ],
    },
    // PCケース・筐体の質問
    {
      categoryName: "PCケース・筐体",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "PCケースをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "ゲーミング",
              description: "PCゲーム",
              value: "gaming",
            },
            {
              label: "動画編集・創作",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "サーバー・ワークステーション",
              description: "サーバー用途、ワークステーション",
              value: "server_workstation",
            },
            {
              label: "HTPC・メディアセンター",
              description: "ホームシアターPC",
              value: "htpc_media",
            },
            {
              label: "コンパクトPC",
              description: "小型PC",
              value: "compact_pc",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "PCケースの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_30k",
            },
          ],
        },
        {
          text: "フォームファクターの希望は？",
          description: "PCケースのサイズについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "Mini-ITX",
              description: "超小型",
              value: "form_mini_itx",
            },
            {
              label: "Micro-ATX",
              description: "小型",
              value: "form_micro_atx",
            },
            {
              label: "ATX",
              description: "標準サイズ",
              value: "form_atx",
            },
            {
              label: "E-ATX",
              description: "大型",
              value: "form_e_atx",
            },
          ],
        },
        {
          text: "設置場所の制約はありますか？",
          description: "PCケースの設置場所について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "デスク上",
              description: "机の上に設置",
              value: "desk_top",
            },
            {
              label: "デスク下",
              description: "机の下に設置",
              value: "desk_bottom",
            },
            {
              label: "床置き",
              description: "床に直接設置",
              value: "floor",
            },
            {
              label: "壁掛け",
              description: "壁に掛けて設置",
              value: "wall_mount",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "RGBライティング",
              description: "光る機能",
              value: "feature_rgb",
            },
            {
              label: "サイドパネル",
              description: "透明サイドパネル",
              value: "feature_side_panel",
            },
            {
              label: "USB-Cポート",
              description: "USB-Cポート付き",
              value: "feature_usb_c",
            },
            {
              label: "ファンコントローラー",
              description: "ファン制御機能",
              value: "feature_fan_controller",
            },
            {
              label: "ドライブベイ",
              description: "多数のドライブベイ",
              value: "feature_drive_bays",
            },
            {
              label: "ケーブル管理",
              description: "ケーブル整理機能",
              value: "feature_cable_management",
            },
          ],
        },
      ],
    },
    // PCケース用電源の質問
    {
      categoryName: "PCケース用電源",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "電源をどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "一般業務",
              description: "文書作成、表計算等",
              value: "office_work",
            },
            {
              label: "ゲーミング",
              description: "PCゲーム",
              value: "gaming",
            },
            {
              label: "動画編集・創作",
              description: "クリエイティブ作業",
              value: "video_editing",
            },
            {
              label: "サーバー・ワークステーション",
              description: "サーバー用途、ワークステーション",
              value: "server_workstation",
            },
            {
              label: "オーバークロック",
              description: "オーバークロック用途",
              value: "overclock",
            },
            {
              label: "静音PC",
              description: "静音PC",
              value: "silent_pc",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "電源の購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_30k",
            },
          ],
        },
        {
          text: "出力電力の希望は？",
          description: "電源の出力電力について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "400W以下",
              description: "低消費電力",
              value: "power_400w_under",
            },
            {
              label: "400-600W",
              description: "中消費電力",
              value: "power_400_600w",
            },
            {
              label: "600-800W",
              description: "高消費電力",
              value: "power_600_800w",
            },
            {
              label: "800W以上",
              description: "超高消費電力",
              value: "power_800w_over",
            },
          ],
        },
        {
          text: "認証レベルの希望は？",
          description: "電源の認証レベルについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "80Plus Bronze",
              description: "基本的な効率",
              value: "cert_bronze",
            },
            {
              label: "80Plus Silver",
              description: "中程度の効率",
              value: "cert_silver",
            },
            {
              label: "80Plus Gold",
              description: "高効率",
              value: "cert_gold",
            },
            {
              label: "80Plus Platinum",
              description: "最高効率",
              value: "cert_platinum",
            },
            {
              label: "80Plus Titanium",
              description: "最高効率+",
              value: "cert_titanium",
            },
          ],
        },
        {
          text: "静音性の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "モジュラーケーブルの希望は？",
          description: "ケーブルの取り外し機能について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "フルモジュラー",
              description: "全てのケーブルが取り外し可能",
              value: "modular_full",
            },
            {
              label: "セミモジュラー",
              description: "一部のケーブルが取り外し可能",
              value: "modular_semi",
            },
            {
              label: "ノンモジュラー",
              description: "ケーブルは固定",
              value: "modular_none",
            },
            {
              label: "どれでも良い",
              description: "モジュラー機能は問わない",
              value: "modular_any",
            },
          ],
        },
      ],
    },
    // ソーラーチャージャーの質問
    {
      categoryName: "ソーラーチャージャー",
      questions: [
        {
          text: "主な使用シーンは？",
          description: "ソーラーチャージャーをどのような場面で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "アウトドア・キャンプ",
              description: "キャンプ、ハイキング等",
              value: "outdoor_camping",
            },
            {
              label: "災害時・非常時",
              description: "停電時、災害時",
              value: "emergency",
            },
            {
              label: "旅行・出張",
              description: "旅行、出張時の充電",
              value: "travel",
            },
            {
              label: "日常使用",
              description: "日常的な充電",
              value: "daily_use",
            },
            {
              label: "車中泊",
              description: "車中泊での使用",
              value: "car_camping",
            },
            {
              label: "その他",
              description: "その他の用途",
              value: "other",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ソーラーチャージャーの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_30k",
            },
          ],
        },
        {
          text: "充電したいデバイスは？",
          description: "どのデバイスを充電しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "スマートフォン",
              description: "iPhone、Android",
              value: "device_smartphone",
            },
            {
              label: "タブレット",
              description: "iPad、Androidタブレット",
              value: "device_tablet",
            },
            {
              label: "ノートPC",
              description: "ノートパソコン",
              value: "device_laptop",
            },
            {
              label: "カメラ",
              description: "デジタルカメラ",
              value: "device_camera",
            },
            {
              label: "その他",
              description: "その他のデバイス",
              value: "device_other",
            },
          ],
        },
        {
          text: "出力ポート数の希望は？",
          description: "同時に充電できるデバイス数について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "1ポート",
              description: "1つのデバイスのみ",
              value: "ports_1",
            },
            {
              label: "2-3ポート",
              description: "2-3つのデバイス",
              value: "ports_2_3",
            },
            {
              label: "4-5ポート",
              description: "4-5つのデバイス",
              value: "ports_4_5",
            },
            {
              label: "6ポート以上",
              description: "6つ以上のデバイス",
              value: "ports_6_plus",
            },
          ],
        },
        {
          text: "充電速度の希望は？",
          description: "充電の速度について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "低速充電",
              description: "ゆっくり充電",
              value: "speed_slow",
            },
            {
              label: "標準充電",
              description: "一般的な充電速度",
              value: "speed_standard",
            },
            {
              label: "高速充電",
              description: "高速充電対応",
              value: "speed_fast",
            },
            {
              label: "最大速度",
              description: "最大限の充電速度",
              value: "speed_max",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "折りたたみ式",
              description: "コンパクトに収納可能",
              value: "feature_foldable",
            },
            {
              label: "LEDライト",
              description: "ライト機能付き",
              value: "feature_led_light",
            },
            {
              label: "USB-C PD",
              description: "USB-C Power Delivery対応",
              value: "feature_usb_c_pd",
            },
            {
              label: "ワイヤレス充電",
              description: "ワイヤレス充電機能",
              value: "feature_wireless",
            },
            {
              label: "バッテリー内蔵",
              description: "バッテリー内蔵型",
              value: "feature_built_in_battery",
            },
          ],
        },
      ],
    },
    // 交換用電池パックの質問
    {
      categoryName: "交換用電池パック",
      questions: [
        {
          text: "交換したいデバイスは？",
          description: "どのデバイスの電池を交換しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "スマートフォン",
              description: "iPhone、Android",
              value: "device_smartphone",
            },
            {
              label: "ノートPC",
              description: "ノートパソコン",
              value: "device_laptop",
            },
            {
              label: "タブレット",
              description: "iPad、Androidタブレット",
              value: "device_tablet",
            },
            {
              label: "ゲーム機",
              description: "Nintendo Switch等",
              value: "device_gaming",
            },
            {
              label: "その他",
              description: "その他のデバイス",
              value: "device_other",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "交換用電池パックの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-15,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_15k",
            },
            {
              label: "15,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_15k",
            },
          ],
        },
        {
          text: "容量の希望は？",
          description: "バッテリーの容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "標準容量",
              description: "元のバッテリーと同じ容量",
              value: "capacity_standard",
            },
            {
              label: "大容量",
              description: "元のバッテリーより大容量",
              value: "capacity_large",
            },
            {
              label: "最大容量",
              description: "可能な限り大容量",
              value: "capacity_max",
            },
            {
              label: "どれでも良い",
              description: "容量は問わない",
              value: "capacity_any",
            },
          ],
        },
        {
          text: "品質の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "互換性の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
      ],
    },
    // ケース型バッテリーの質問
    {
      categoryName: "ケース型バッテリー",
      questions: [
        {
          text: "対応したいスマートフォンは？",
          description: "どのスマートフォンに対応させますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "iPhone",
              description: "iPhone全般",
              value: "phone_iphone",
            },
            {
              label: "Android",
              description: "Android全般",
              value: "phone_android",
            },
            {
              label: "iPhone 15シリーズ",
              description: "iPhone 15/15 Plus/15 Pro/15 Pro Max",
              value: "phone_iphone_15",
            },
            {
              label: "iPhone 14シリーズ",
              description: "iPhone 14/14 Plus/14 Pro/14 Pro Max",
              value: "phone_iphone_14",
            },
            {
              label: "iPhone 13シリーズ",
              description: "iPhone 13/13 mini/13 Pro/13 Pro Max",
              value: "phone_iphone_13",
            },
            {
              label: "その他",
              description: "その他のスマートフォン",
              value: "phone_other",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "ケース型バッテリーの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-15,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_15k",
            },
            {
              label: "15,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_15k",
            },
          ],
        },
        {
          text: "容量の希望は？",
          description: "バッテリーの容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "2,000mAh以下",
              description: "小容量",
              value: "capacity_2000mAh_under",
            },
            {
              label: "2,000-3,000mAh",
              description: "中容量",
              value: "capacity_2000_3000mAh",
            },
            {
              label: "3,000-5,000mAh",
              description: "大容量",
              value: "capacity_3000_5000mAh",
            },
            {
              label: "5,000mAh以上",
              description: "超大容量",
              value: "capacity_5000mAh_over",
            },
          ],
        },
        {
          text: "充電速度の希望は？",
          description: "充電の速度について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "標準充電",
              description: "一般的な充電速度",
              value: "speed_standard",
            },
            {
              label: "高速充電",
              description: "高速充電対応",
              value: "speed_fast",
            },
            {
              label: "最大速度",
              description: "最大限の充電速度",
              value: "speed_max",
            },
            {
              label: "どれでも良い",
              description: "充電速度は問わない",
              value: "speed_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "ワイヤレス充電",
              description: "ワイヤレス充電機能",
              value: "feature_wireless",
            },
            {
              label: "防水機能",
              description: "水に強い設計",
              value: "feature_waterproof",
            },
            {
              label: "LEDライト",
              description: "ライト機能付き",
              value: "feature_led_light",
            },
            {
              label: "スタンド機能",
              description: "スタンドとして使用可能",
              value: "feature_stand",
            },
            {
              label: "カード収納",
              description: "カード収納機能",
              value: "feature_card_storage",
            },
            {
              label: "指紋認証",
              description: "指紋認証機能",
              value: "feature_fingerprint",
            },
          ],
        },
      ],
    },
    // クレードル・ドックの質問
    {
      categoryName: "クレードル・ドック",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "クレードル・ドックをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "充電スタンド",
              description: "充電専用",
              value: "charging_stand",
            },
            {
              label: "デスク設置",
              description: "デスクでの使用",
              value: "desk_setup",
            },
            {
              label: "車載用",
              description: "車での使用",
              value: "car_mount",
            },
            {
              label: "ベッドサイド",
              description: "ベッドサイドでの使用",
              value: "bedside",
            },
            {
              label: "オフィス",
              description: "オフィスでの使用",
              value: "office",
            },
            {
              label: "その他",
              description: "その他の用途",
              value: "other",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "クレードル・ドックの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "3,000円以下",
              description: "エントリーモデル",
              value: "budget_under_3k",
            },
            {
              label: "3,000-8,000円",
              description: "ミドルレンジモデル",
              value: "budget_3k_8k",
            },
            {
              label: "8,000-15,000円",
              description: "ハイエンドモデル",
              value: "budget_8k_15k",
            },
            {
              label: "15,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_15k",
            },
          ],
        },
        {
          text: "対応したいデバイスは？",
          description: "どのデバイスに対応させますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "iPhone",
              description: "iPhone全般",
              value: "device_iphone",
            },
            {
              label: "Android",
              description: "Android全般",
              value: "device_android",
            },
            {
              label: "AirPods",
              description: "AirPods",
              value: "device_airpods",
            },
            {
              label: "Apple Watch",
              description: "Apple Watch",
              value: "device_apple_watch",
            },
            {
              label: "その他",
              description: "その他のデバイス",
              value: "device_other",
            },
          ],
        },
        {
          text: "充電方式の希望は？",
          description: "充電の方式について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "有線充電",
              description: "ケーブル接続",
              value: "charging_wired",
            },
            {
              label: "ワイヤレス充電",
              description: "ワイヤレス充電",
              value: "charging_wireless",
            },
            {
              label: "両方対応",
              description: "有線とワイヤレスの両方",
              value: "charging_both",
            },
            {
              label: "どれでも良い",
              description: "充電方式は問わない",
              value: "charging_any",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "LEDライト",
              description: "ライト機能付き",
              value: "feature_led_light",
            },
            {
              label: "角度調整",
              description: "角度調整可能",
              value: "feature_angle_adjustment",
            },
            {
              label: "USBハブ",
              description: "USBハブ機能",
              value: "feature_usb_hub",
            },
            {
              label: "スピーカー",
              description: "スピーカー機能",
              value: "feature_speaker",
            },
            {
              label: "時計機能",
              description: "時計表示機能",
              value: "feature_clock",
            },
            {
              label: "アラーム機能",
              description: "アラーム機能",
              value: "feature_alarm",
            },
          ],
        },
      ],
    },
    // PCサーバー・ワークステーションの質問
    {
      categoryName: "PCサーバー・ワークステーション",
      questions: [
        {
          text: "主な用途は何ですか？",
          description:
            "サーバー・ワークステーションをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "Webサーバー",
              description: "Webサイト・アプリケーションのホスティング",
              value: "web_server",
            },
            {
              label: "データベースサーバー",
              description: "データベースの運用・管理",
              value: "database_server",
            },
            {
              label: "ファイルサーバー",
              description: "ファイル共有・ストレージ",
              value: "file_server",
            },
            {
              label: "仮想化サーバー",
              description: "仮想マシンの運用",
              value: "virtualization_server",
            },
            {
              label: "3DCG・CAD",
              description: "3Dモデリング、設計作業",
              value: "3d_cad",
            },
            {
              label: "データ分析・AI",
              description: "機械学習、データ分析",
              value: "data_analysis",
            },
            {
              label: "動画編集・レンダリング",
              description: "動画制作、レンダリング作業",
              value: "video_rendering",
            },
            {
              label: "科学計算・シミュレーション",
              description: "研究・開発用途",
              value: "scientific_computing",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "サーバー・ワークステーションの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "10万円以下",
              description: "エントリーモデル",
              value: "budget_under_100k",
            },
            {
              label: "10-30万円",
              description: "ミドルレンジモデル",
              value: "budget_100k_300k",
            },
            {
              label: "30-100万円",
              description: "ハイエンドモデル",
              value: "budget_300k_1m",
            },
            {
              label: "100万円以上",
              description: "エンタープライズモデル",
              value: "budget_over_1m",
            },
          ],
        },
        {
          text: "CPU性能の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "メモリ容量の希望は？",
          description:
            "サーバー・ワークステーションのメモリ容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "16GB",
              description: "基本容量",
              value: "memory_16gb",
            },
            {
              label: "32GB",
              description: "標準容量",
              value: "memory_32gb",
            },
            {
              label: "64GB",
              description: "大容量",
              value: "memory_64gb",
            },
            {
              label: "128GB以上",
              description: "超大容量",
              value: "memory_128gb_plus",
            },
          ],
        },
        {
          text: "ストレージ容量の希望は？",
          description: "ストレージの容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "500GB-1TB",
              description: "基本容量",
              value: "storage_500gb_1tb",
            },
            {
              label: "1-2TB",
              description: "標準容量",
              value: "storage_1_2tb",
            },
            {
              label: "2-5TB",
              description: "大容量",
              value: "storage_2_5tb",
            },
            {
              label: "5TB以上",
              description: "超大容量",
              value: "storage_5tb_plus",
            },
          ],
        },
        {
          text: "24時間稼働の必要性は？",
          description: "サーバーとして24時間稼働させる必要がありますか？",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "必須",
              description: "24時間稼働は絶対必要",
              value: "24_7_required",
            },
            {
              label: "あった方が良い",
              description: "24時間稼働を希望する",
              value: "24_7_preferred",
            },
            {
              label: "不要",
              description: "24時間稼働は不要",
              value: "24_7_not_needed",
            },
          ],
        },
        {
          text: "冗長性の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "拡張性の重要度は？",
          description: "1（重要でない）から10（とても重要）で評価してください",
          type: QuestionType.RANGE,
          is_required: false,
          options: [],
        },
        {
          text: "管理機能の希望は？",
          description: "サーバー管理に必要な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "リモート管理",
              description: "リモートでの管理機能",
              value: "feature_remote_management",
            },
            {
              label: "監視機能",
              description: "システム監視機能",
              value: "feature_monitoring",
            },
            {
              label: "冗長電源",
              description: "冗長電源ユニット",
              value: "feature_redundant_power",
            },
            {
              label: "ホットスワップ",
              description: "ホットスワップ対応",
              value: "feature_hot_swap",
            },
            {
              label: "RAID対応",
              description: "RAID機能",
              value: "feature_raid",
            },
            {
              label: "仮想化対応",
              description: "仮想化技術対応",
              value: "feature_virtualization",
            },
          ],
        },
      ],
    },
    // スティックPCの質問
    {
      categoryName: "スティックPC",
      questions: [
        {
          text: "主な用途は何ですか？",
          description: "スティックPCをどのような用途で使用しますか？",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "メディアストリーミング",
              description: "動画・音楽のストリーミング",
              value: "media_streaming",
            },
            {
              label: "デジタルサイネージ",
              description: "店舗・オフィスの表示用",
              value: "digital_signage",
            },
            {
              label: "軽量PC",
              description: "軽量なPCとして使用",
              value: "lightweight_pc",
            },
            {
              label: "IoT・組み込み",
              description: "IoTデバイス・組み込み用途",
              value: "iot_embedded",
            },
            {
              label: "プレゼンテーション",
              description: "会議・プレゼン用",
              value: "presentation",
            },
            {
              label: "教育・学習",
              description: "教育・学習用途",
              value: "education",
            },
          ],
        },
        {
          text: "ご希望の予算はどのくらいですか？",
          description: "スティックPCの購入予算を教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "5,000円以下",
              description: "エントリーモデル",
              value: "budget_under_5k",
            },
            {
              label: "5,000-15,000円",
              description: "ミドルレンジモデル",
              value: "budget_5k_15k",
            },
            {
              label: "15,000-30,000円",
              description: "ハイエンドモデル",
              value: "budget_15k_30k",
            },
            {
              label: "30,000円以上",
              description: "プロフェッショナルモデル",
              value: "budget_over_30k",
            },
          ],
        },
        {
          text: "接続方式の希望は？",
          description: "スティックPCの接続方法について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "HDMI",
              description: "HDMI接続",
              value: "connection_hdmi",
            },
            {
              label: "USB-C",
              description: "USB-C接続",
              value: "connection_usb_c",
            },
            {
              label: "ワイヤレス",
              description: "ワイヤレス接続",
              value: "connection_wireless",
            },
            {
              label: "どれでも良い",
              description: "接続方式は問わない",
              value: "connection_any",
            },
          ],
        },
        {
          text: "OSの希望は？",
          description: "スティックPCのOSについて教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "Windows",
              description: "Windows OS",
              value: "os_windows",
            },
            {
              label: "Android",
              description: "Android OS",
              value: "os_android",
            },
            {
              label: "Linux",
              description: "Linux OS",
              value: "os_linux",
            },
            {
              label: "どれでも良い",
              description: "OSは問わない",
              value: "os_any",
            },
          ],
        },
        {
          text: "ストレージ容量の希望は？",
          description: "ストレージの容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "32GB以下",
              description: "小容量",
              value: "storage_32gb_under",
            },
            {
              label: "64GB",
              description: "標準容量",
              value: "storage_64gb",
            },
            {
              label: "128GB",
              description: "大容量",
              value: "storage_128gb",
            },
            {
              label: "256GB以上",
              description: "超大容量",
              value: "storage_256gb_plus",
            },
          ],
        },
        {
          text: "メモリ容量の希望は？",
          description: "メモリの容量について教えてください",
          type: QuestionType.SINGLE_CHOICE,
          is_required: true,
          options: [
            {
              label: "2GB",
              description: "基本容量",
              value: "memory_2gb",
            },
            {
              label: "4GB",
              description: "標準容量",
              value: "memory_4gb",
            },
            {
              label: "8GB",
              description: "大容量",
              value: "memory_8gb",
            },
            {
              label: "16GB以上",
              description: "超大容量",
              value: "memory_16gb_plus",
            },
          ],
        },
        {
          text: "特殊機能の希望は？",
          description: "特別な機能について教えてください",
          type: QuestionType.MULTIPLE_CHOICE,
          is_required: false,
          options: [
            {
              label: "Wi-Fi",
              description: "Wi-Fi機能",
              value: "feature_wifi",
            },
            {
              label: "Bluetooth",
              description: "Bluetooth機能",
              value: "feature_bluetooth",
            },
            {
              label: "USBポート",
              description: "USBポート付き",
              value: "feature_usb_ports",
            },
            {
              label: "SDカードスロット",
              description: "SDカードスロット",
              value: "feature_sd_slot",
            },
            {
              label: "音声出力",
              description: "音声出力機能",
              value: "feature_audio_output",
            },
            {
              label: "電源アダプター付き",
              description: "電源アダプター付き",
              value: "feature_power_adapter",
            },
          ],
        },
      ],
    },
  ];

  // 質問を作成
  const createdQuestions = [];
  for (const categoryData of questionsData) {
    const categoryId = categoryMap[categoryData.categoryName];
    if (!categoryId) continue;

    for (const questionData of categoryData.questions) {
      const question = await prisma.question.create({
        data: {
          categoryId,
          text: questionData.text,
          description: questionData.description,
          type: questionData.type,
          is_required: questionData.is_required,
        },
      });

      // 選択肢を作成
      if (questionData.options.length > 0) {
        await prisma.questionOption.createMany({
          data: questionData.options.map((option) => ({
            questionId: question.id,
            label: option.label,
            description: option.description,
            value: option.value,
          })),
        });
      }

      createdQuestions.push(question);
    }
  }

  console.log(`✅ 質問と選択肢作成完了 (${createdQuestions.length}件の質問)`);
}

async function main() {
  console.log("🚀 データベースシード開始...");

  try {
    // データベースクリーンアップ
    await cleanDatabase();

    // カテゴリを作成
    const categoryMap = await createCategories();

    // カテゴリキーポイントを作成
    await createCategoryKeyPoints(categoryMap);

    // 一般的な質問を作成
    await createCommonQuestions(categoryMap);

    // タグを作成
    const tags = await createTags();

    // 製品を作成
    const products = await createProducts();

    // 製品とカテゴリの関連付けを作成
    await createProductCategories(products, categoryMap);

    // 製品とタグの関連付けを作成
    await createProductTags(products, tags);

    // 質問と質問選択肢を作成
    await createQuestionsAndOptions(categoryMap);

    // 完了メッセージ
    console.log("🎉 データベースシード完了！");
    console.log("");
    console.log("📊 作成されたデータのサマリー:");
    console.log("- メインカテゴリ: 10");
    console.log("- サブカテゴリ: 29");
    console.log("- 総カテゴリ数: 39");
    console.log("- 製品数: 12");
    console.log("- タグ数: 10");
    console.log("- 質問数: 250");
    console.log("- カテゴリキーポイント: 各カテゴリに適切なキーポイント");
    console.log("- よくある質問: 各カテゴリにFAQ");
  } catch (error) {
    console.error("❌ シード処理中にエラーが発生しました:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// メイン実行
main().catch((e) => {
  console.error("❌ シード処理中にエラーが発生しました:", e);
  process.exit(1);
});
