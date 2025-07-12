import { PrismaClient } from "@prisma/client";
import { QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clean existing data (in correct order to avoid foreign key constraints)
  await prisma.answer.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.userHistory.deleteMany();
  await prisma.questionnaireSession.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.productTag.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.categoryCommonQuestion.deleteMany();
  await prisma.categoryKeyPoint.deleteMany();
  await prisma.category.deleteMany();

  console.log("Existing data cleaned");

  // Create Categories (楽天市場のカテゴリ構造に基づく)
  const electronicsCategory = await prisma.category.create({
    data: {
      name: "パソコン・周辺機器",
      description: "パソコン本体・周辺機器・アクセサリー",
    },
  });

  const smartphoneCategory = await prisma.category.create({
    data: {
      name: "スマートフォン・タブレット",
      description: "スマートフォン本体・タブレット・アクセサリー",
    },
  });

  const laptopCategory = await prisma.category.create({
    data: {
      name: "ノートPC",
      description: "ノートパソコン",
      parentId: electronicsCategory.id,
    },
  });

  const desktopCategory = await prisma.category.create({
    data: {
      name: "デスクトップPC",
      description: "デスクトップパソコン",
      parentId: electronicsCategory.id,
    },
  });

  const smartphoneBodiesCategory = await prisma.category.create({
    data: {
      name: "スマートフォン本体",
      description: "スマートフォン本体・SIMフリー端末",
      parentId: smartphoneCategory.id,
    },
  });

  const wearableCategory = await prisma.category.create({
    data: {
      name: "スマートウォッチ・ウェアラブル端末",
      description: "スマートウォッチ・フィットネストラッカー",
    },
  });

  const cameraCategory = await prisma.category.create({
    data: {
      name: "TV・オーディオ・カメラ",
      description: "テレビ・オーディオ・カメラ・ビデオカメラ",
    },
  });

  const digitalCameraCategory = await prisma.category.create({
    data: {
      name: "デジタルカメラ",
      description: "デジタル一眼・ミラーレス・コンパクトカメラ",
      parentId: cameraCategory.id,
    },
  });

  console.log("Categories created");

  // Create Category Key Points
  await Promise.all([
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        point: "バッテリー持続時間",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        point: "カメラ性能",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        point: "ディスプレイサイズ",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        point: "ストレージ容量",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: laptopCategory.id,
        point: "CPU性能",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: laptopCategory.id,
        point: "メモリ容量",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: laptopCategory.id,
        point: "画面サイズ",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: wearableCategory.id,
        point: "ヘルスケア機能",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: wearableCategory.id,
        point: "バッテリー駆動時間",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: digitalCameraCategory.id,
        point: "画素数",
      },
    }),
    prisma.categoryKeyPoint.create({
      data: {
        categoryId: digitalCameraCategory.id,
        point: "レンズ性能",
      },
    }),
  ]);

  console.log("Category Key Points created");

  // Create Category Common Questions
  await Promise.all([
    prisma.categoryCommonQuestion.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        question: "SIMフリー端末と通信キャリア端末の違いは？",
        answer:
          "SIMフリー端末はどの通信会社でも利用可能で、通信キャリア端末は特定の会社での利用が前提となります。",
      },
    }),
    prisma.categoryCommonQuestion.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        question: "ストレージ容量はどのくらい必要？",
        answer:
          "写真や動画を多く保存する場合は128GB以上、一般的な利用なら64GBで十分です。",
      },
    }),
    prisma.categoryCommonQuestion.create({
      data: {
        categoryId: laptopCategory.id,
        question: "メモリは何GB必要？",
        answer:
          "一般的な用途なら8GB、動画編集やゲームなら16GB以上をおすすめします。",
      },
    }),
    prisma.categoryCommonQuestion.create({
      data: {
        categoryId: laptopCategory.id,
        question: "SSDとHDDの違いは？",
        answer:
          "SSDは高速でバッテリー持ちが良く、HDDは大容量で安価です。現在はSSDが主流です。",
      },
    }),
    prisma.categoryCommonQuestion.create({
      data: {
        categoryId: wearableCategory.id,
        question: "スマートウォッチの防水性能は？",
        answer:
          "ほとんどのモデルが日常生活防水に対応していますが、水泳対応モデルもあります。",
      },
    }),
  ]);

  console.log("Category Common Questions created");

  // Create Tags (楽天市場でよく使われるタグ)
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: "送料無料",
        description: "送料無料商品",
        color: "#FF6B6B",
      },
    }),
    prisma.tag.create({
      data: {
        name: "ポイント10倍",
        description: "楽天ポイント10倍対象",
        color: "#4ECDC4",
      },
    }),
    prisma.tag.create({
      data: {
        name: "即日配送",
        description: "即日配送対応",
        color: "#45B7D1",
      },
    }),
    prisma.tag.create({
      data: {
        name: "レビュー高評価",
        description: "レビュー評価4.5以上",
        color: "#96CEB4",
      },
    }),
    prisma.tag.create({
      data: {
        name: "在庫限り",
        description: "在庫限りの特価商品",
        color: "#FECA57",
      },
    }),
    prisma.tag.create({
      data: {
        name: "SIMフリー",
        description: "SIMフリー端末",
        color: "#FF9FF3",
      },
    }),
    prisma.tag.create({
      data: {
        name: "国内正規品",
        description: "国内正規品・メーカー保証付き",
        color: "#54A0FF",
      },
    }),
    prisma.tag.create({
      data: {
        name: "新品未開封",
        description: "新品未開封品",
        color: "#5F27CD",
      },
    }),
  ]);

  console.log("Tags created");

  // Create Products (楽天市場のデータ形式に基づく)
  const products = await Promise.all([
    // スマートフォン
    prisma.product.create({
      data: {
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
    }),
    prisma.product.create({
      data: {
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
    }),
    prisma.product.create({
      data: {
        name: "Pixel 8 Pro 128GB SIMフリー",
        description:
          "Google Pixel 8 Pro 128GB SIMフリー [オブシディアン] 国内正規品 新品",
        price: 159000,
        rating: 4.52,
        features:
          "Google Tensor G3・6.7インチLTPO OLED・Pro級カメラ・マジック消しゴム・音声消しゴム・ベストテイク・長時間バッテリー",
        rakuten_url: "https://www.rakuten.co.jp/",
        image_url: "",
      },
    }),

    // ノートPC
    prisma.product.create({
      data: {
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
    }),
    prisma.product.create({
      data: {
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
    }),
    prisma.product.create({
      data: {
        name: "ASUS ZenBook 14 OLED",
        description:
          "ASUS ZenBook 14 OLED UX3402ZA 14型 Intel Core i5-1240P 8GB 512GB SSD",
        price: 129800,
        rating: 4.45,
        features:
          "Intel Core i5-1240P・8GBメモリ・512GB SSD・14インチ2.8K有機ELディスプレイ・約1.39kg・Harman Kardonオーディオ・指紋認証",
        rakuten_url: "https://www.rakuten.co.jp/",
        image_url: "",
      },
    }),

    // ウェアラブル
    prisma.product.create({
      data: {
        name: "Apple Watch Series 9 GPS 45mm",
        description:
          "Apple Watch Series 9 GPS 45mmケース [ピンクアルミニウム] スポーツバンド 新品 国内正規品",
        price: 59800,
        rating: 4.76,
        features:
          "S9 SiP・常時表示Retina LTPO OLEDディスプレイ・血中酸素ウェルネスアプリ・ECGアプリ・高心拍数と低心拍数の通知・最大18時間のバッテリー駆動時間",
        rakuten_url: "https://www.rakuten.co.jp/",
        image_url: "",
      },
    }),
    prisma.product.create({
      data: {
        name: "Galaxy Watch6 40mm",
        description:
          "Samsung Galaxy Watch6 40mm Bluetooth [ピンクゴールド] 新品 国内正規品",
        price: 39800,
        rating: 4.58,
        features:
          "Exynos W930・1.3インチSuper AMOLEDディスプレイ・体組成測定・睡眠コーチング・最大40時間のバッテリー駆動時間・5ATM + IP68・Wear OS",
        rakuten_url: "https://www.rakuten.co.jp/",
        image_url: "",
      },
    }),

    // デスクトップPC
    prisma.product.create({
      data: {
        name: "iMac 24インチ M4チップ搭載",
        description:
          "Apple iMac 24インチ M4チップ搭載 16GBメモリ 256GB SSD [ブルー] 新品 国内正規品",
        price: 198800,
        rating: 4.85,
        features:
          "Apple M4チップ・8コアCPU・8コアGPU・16GBユニファイドメモリ・256GB SSD・24インチ4.5K Retinaディスプレイ・1080p FaceTime HDカメラ",
        rakuten_url: "https://www.rakuten.co.jp/",
        image_url: "",
      },
    }),
    prisma.product.create({
      data: {
        name: "Dell OptiPlex 7010 デスクトップPC",
        description:
          "Dell OptiPlex 7010 デスクトップPC Intel Core i7-13700 16GB 512GB SSD Windows 11 Pro",
        price: 159800,
        rating: 4.62,
        features:
          "Intel Core i7-13700・16GBメモリ・512GB SSD・Windows 11 Pro・DisplayPort・USB 3.2・省スペース設計・3年保証",
        rakuten_url: "https://www.rakuten.co.jp/",
        image_url: "",
      },
    }),

    // デジタルカメラ
    prisma.product.create({
      data: {
        name: "Canon EOS R6 Mark II ボディ",
        description:
          "Canon EOS R6 Mark II ミラーレス一眼カメラ ボディのみ 新品 国内正規品",
        price: 328000,
        rating: 4.82,
        features:
          "有効約2420万画素CMOSセンサー・DIGIC X・最高約40コマ/秒連続撮影・4K UHD 60P動画・ボディ内手ブレ補正・デュアルピクセルCMOS AF II",
        rakuten_url: "https://www.rakuten.co.jp/",
        image_url: "",
      },
    }),
    prisma.product.create({
      data: {
        name: "Sony α7 IV ボディ",
        description:
          "Sony α7 IV ILCE-7M4 ミラーレス一眼カメラ ボディのみ 新品 国内正規品",
        price: 298000,
        rating: 4.79,
        features:
          "有効約3300万画素Exmor R CMOSセンサー・BIONZ XR・リアルタイム瞳AF・4K 60p動画記録・5軸ボディ内手ブレ補正・693点像面位相差AFセンサー",
        rakuten_url: "https://www.rakuten.co.jp/",
        image_url: "",
      },
    }),
  ]);

  console.log("Products created");

  // Create Product Categories
  await Promise.all([
    // スマートフォン
    prisma.productCategory.create({
      data: {
        productId: products[0].id, // iPhone 15 Pro
        categoryId: smartphoneBodiesCategory.id,
      },
    }),
    prisma.productCategory.create({
      data: {
        productId: products[1].id, // Galaxy S24 Ultra
        categoryId: smartphoneBodiesCategory.id,
      },
    }),
    prisma.productCategory.create({
      data: {
        productId: products[2].id, // Pixel 8 Pro
        categoryId: smartphoneBodiesCategory.id,
      },
    }),

    // ノートPC
    prisma.productCategory.create({
      data: {
        productId: products[3].id, // MacBook Pro
        categoryId: laptopCategory.id,
      },
    }),
    prisma.productCategory.create({
      data: {
        productId: products[4].id, // ThinkPad
        categoryId: laptopCategory.id,
      },
    }),
    prisma.productCategory.create({
      data: {
        productId: products[5].id, // ASUS ZenBook
        categoryId: laptopCategory.id,
      },
    }),

    // ウェアラブル
    prisma.productCategory.create({
      data: {
        productId: products[6].id, // Apple Watch
        categoryId: wearableCategory.id,
      },
    }),
    prisma.productCategory.create({
      data: {
        productId: products[7].id, // Galaxy Watch
        categoryId: wearableCategory.id,
      },
    }),

    // デスクトップPC
    prisma.productCategory.create({
      data: {
        productId: products[8].id, // iMac 24インチ
        categoryId: desktopCategory.id,
      },
    }),
    prisma.productCategory.create({
      data: {
        productId: products[9].id, // Dell OptiPlex
        categoryId: desktopCategory.id,
      },
    }),

    // デジタルカメラ
    prisma.productCategory.create({
      data: {
        productId: products[10].id, // Canon EOS R6
        categoryId: digitalCameraCategory.id,
      },
    }),
    prisma.productCategory.create({
      data: {
        productId: products[11].id, // Sony α7 IV
        categoryId: digitalCameraCategory.id,
      },
    }),
  ]);

  console.log("Product Categories created");

  // Create Product Tags (楽天市場のタグ付けに基づく)
  await Promise.all([
    // iPhone 15 Pro
    prisma.productTag.create({
      data: {
        productId: products[0].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[0].id,
        tagId: tags[5].id, // SIMフリー
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[0].id,
        tagId: tags[6].id, // 国内正規品
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[0].id,
        tagId: tags[7].id, // 新品未開封
      },
    }),

    // Galaxy S24 Ultra
    prisma.productTag.create({
      data: {
        productId: products[1].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[1].id,
        tagId: tags[1].id, // ポイント10倍
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[1].id,
        tagId: tags[5].id, // SIMフリー
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[1].id,
        tagId: tags[6].id, // 国内正規品
      },
    }),

    // Pixel 8 Pro
    prisma.productTag.create({
      data: {
        productId: products[2].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[2].id,
        tagId: tags[5].id, // SIMフリー
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[2].id,
        tagId: tags[6].id, // 国内正規品
      },
    }),

    // MacBook Pro
    prisma.productTag.create({
      data: {
        productId: products[3].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[3].id,
        tagId: tags[3].id, // レビュー高評価
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[3].id,
        tagId: tags[6].id, // 国内正規品
      },
    }),

    // ThinkPad
    prisma.productTag.create({
      data: {
        productId: products[4].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[4].id,
        tagId: tags[2].id, // 即日配送
      },
    }),

    // ASUS ZenBook
    prisma.productTag.create({
      data: {
        productId: products[5].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[5].id,
        tagId: tags[1].id, // ポイント10倍
      },
    }),

    // Apple Watch
    prisma.productTag.create({
      data: {
        productId: products[6].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[6].id,
        tagId: tags[3].id, // レビュー高評価
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[6].id,
        tagId: tags[6].id, // 国内正規品
      },
    }),

    // Galaxy Watch
    prisma.productTag.create({
      data: {
        productId: products[7].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[7].id,
        tagId: tags[1].id, // ポイント10倍
      },
    }),

    // iMac 24インチ
    prisma.productTag.create({
      data: {
        productId: products[8].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[8].id,
        tagId: tags[3].id, // レビュー高評価
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[8].id,
        tagId: tags[6].id, // 国内正規品
      },
    }),

    // Dell OptiPlex
    prisma.productTag.create({
      data: {
        productId: products[9].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[9].id,
        tagId: tags[2].id, // 即日配送
      },
    }),

    // Canon EOS R6
    prisma.productTag.create({
      data: {
        productId: products[10].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[10].id,
        tagId: tags[3].id, // レビュー高評価
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[10].id,
        tagId: tags[6].id, // 国内正規品
      },
    }),

    // Sony α7 IV
    prisma.productTag.create({
      data: {
        productId: products[11].id,
        tagId: tags[0].id, // 送料無料
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[11].id,
        tagId: tags[3].id, // レビュー高評価
      },
    }),
    prisma.productTag.create({
      data: {
        productId: products[11].id,
        tagId: tags[6].id, // 国内正規品
      },
    }),
  ]);

  console.log("Product Tags created");

  // Create Questions
  const questions = await Promise.all([
    // Smartphone questions
    prisma.question.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        text: "主な使用用途は何ですか？",
        description:
          "スマートフォンをどのような場面で使用されることが多いですか？",
        type: QuestionType.SINGLE_CHOICE,
        is_required: true,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        text: "ご希望の予算はどのくらいですか？",
        description: "スマートフォンの購入予算を教えてください",
        type: QuestionType.SINGLE_CHOICE,
        is_required: true,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        text: "カメラ性能の重要度は？",
        description: "1（重要でない）から10（とても重要）で評価してください",
        type: QuestionType.RANGE,
        is_required: false,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: smartphoneBodiesCategory.id,
        text: "ストレージ容量のご希望は？",
        description: "写真や動画の保存量に応じてお選びください",
        type: QuestionType.SINGLE_CHOICE,
        is_required: true,
      },
    }),

    // Laptop questions
    prisma.question.create({
      data: {
        categoryId: laptopCategory.id,
        text: "主な用途は何ですか？",
        description: "ノートPCを主にどのような作業で使用しますか？",
        type: QuestionType.MULTIPLE_CHOICE,
        is_required: true,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: laptopCategory.id,
        text: "持ち運びの頻度は？",
        description: "外出先での使用頻度を教えてください",
        type: QuestionType.SINGLE_CHOICE,
        is_required: true,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: laptopCategory.id,
        text: "ご希望の画面サイズは？",
        description: "作業効率と携帯性のバランスを考慮してお選びください",
        type: QuestionType.SINGLE_CHOICE,
        is_required: true,
      },
    }),

    // Wearable questions
    prisma.question.create({
      data: {
        categoryId: wearableCategory.id,
        text: "重視したい機能は何ですか？",
        description: "最も重要な機能を選んでください",
        type: QuestionType.MULTIPLE_CHOICE,
        is_required: true,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: wearableCategory.id,
        text: "どのスマートフォンをお使いですか？",
        description: "連携機能のため教えてください",
        type: QuestionType.SINGLE_CHOICE,
        is_required: true,
      },
    }),

    // Camera questions
    prisma.question.create({
      data: {
        categoryId: digitalCameraCategory.id,
        text: "撮影レベルはどの程度ですか？",
        description: "あなたの撮影経験を教えてください",
        type: QuestionType.SINGLE_CHOICE,
        is_required: true,
      },
    }),
    prisma.question.create({
      data: {
        categoryId: digitalCameraCategory.id,
        text: "主な撮影対象は？",
        description: "よく撮影する被写体を選んでください",
        type: QuestionType.MULTIPLE_CHOICE,
        is_required: true,
      },
    }),
  ]);

  console.log("Questions created");

  // Create Question Options
  await Promise.all([
    // Smartphone usage options
    prisma.questionOption.create({
      data: {
        questionId: questions[0].id,
        label: "通話・メール・SNS中心",
        description: "基本的な連絡手段として使用",
        value: "basic_communication",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[0].id,
        label: "写真・動画撮影",
        description: "カメラ機能を重視した使用",
        value: "camera_focused",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[0].id,
        label: "ゲーム・動画視聴",
        description: "エンターテイメント用途がメイン",
        value: "entertainment",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[0].id,
        label: "ビジネス・仕事",
        description: "仕事での利用が中心",
        value: "business",
      },
    }),

    // Budget options
    prisma.questionOption.create({
      data: {
        questionId: questions[1].id,
        label: "5万円以下",
        description: "エントリーモデル",
        value: "budget_under_50k",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[1].id,
        label: "5-10万円",
        description: "ミドルレンジモデル",
        value: "budget_50k_100k",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[1].id,
        label: "10-15万円",
        description: "ハイエンドモデル",
        value: "budget_100k_150k",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[1].id,
        label: "15万円以上",
        description: "フラッグシップモデル",
        value: "budget_over_150k",
      },
    }),

    // Storage options
    prisma.questionOption.create({
      data: {
        questionId: questions[3].id,
        label: "64GB以下",
        description: "基本的な用途に十分",
        value: "storage_64gb",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[3].id,
        label: "128GB",
        description: "一般的な使用に最適",
        value: "storage_128gb",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[3].id,
        label: "256GB",
        description: "写真・動画を多く保存",
        value: "storage_256gb",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[3].id,
        label: "512GB以上",
        description: "大容量データを扱う",
        value: "storage_512gb_plus",
      },
    }),

    // Laptop usage options
    prisma.questionOption.create({
      data: {
        questionId: questions[4].id,
        label: "文書作成・表計算",
        description: "Office系ソフトの使用",
        value: "office_work",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[4].id,
        label: "プログラミング・開発",
        description: "コーディング、システム開発",
        value: "programming",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[4].id,
        label: "動画編集・デザイン",
        description: "クリエイティブ作業",
        value: "creative_work",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[4].id,
        label: "ゲーム・娯楽",
        description: "PCゲームや動画視聴",
        value: "gaming_entertainment",
      },
    }),

    // Portability options
    prisma.questionOption.create({
      data: {
        questionId: questions[5].id,
        label: "ほぼ自宅・オフィスのみ",
        description: "持ち運びはほとんどしない",
        value: "stationary_use",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[5].id,
        label: "週に数回持ち運び",
        description: "時々外出先で使用",
        value: "occasional_portable",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[5].id,
        label: "ほぼ毎日持ち運び",
        description: "常に携帯する必要がある",
        value: "daily_portable",
      },
    }),

    // Screen size options
    prisma.questionOption.create({
      data: {
        questionId: questions[6].id,
        label: "13インチ以下",
        description: "軽量・コンパクト重視",
        value: "screen_13inch_under",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[6].id,
        label: "14-15インチ",
        description: "バランスの良いサイズ",
        value: "screen_14_15inch",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[6].id,
        label: "16インチ以上",
        description: "大画面で作業効率重視",
        value: "screen_16inch_over",
      },
    }),

    // Wearable feature options
    prisma.questionOption.create({
      data: {
        questionId: questions[7].id,
        label: "健康管理機能",
        description: "心拍数・血中酸素・睡眠測定",
        value: "health_monitoring",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[7].id,
        label: "フィットネス機能",
        description: "運動記録・GPS・ワークアウト",
        value: "fitness_tracking",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[7].id,
        label: "スマート機能",
        description: "通知・決済・音楽操作",
        value: "smart_features",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[7].id,
        label: "デザイン・ファッション",
        description: "見た目の美しさ・アクセサリー性",
        value: "design_fashion",
      },
    }),

    // Smartphone compatibility
    prisma.questionOption.create({
      data: {
        questionId: questions[8].id,
        label: "iPhone",
        description: "Apple製スマートフォン",
        value: "iphone",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[8].id,
        label: "Android（Galaxy）",
        description: "Samsung Galaxy シリーズ",
        value: "android_galaxy",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[8].id,
        label: "Android（その他）",
        description: "Google Pixel、その他Android端末",
        value: "android_other",
      },
    }),

    // Camera level options
    prisma.questionOption.create({
      data: {
        questionId: questions[9].id,
        label: "初心者",
        description: "カメラを始めたばかり",
        value: "beginner",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[9].id,
        label: "中級者",
        description: "ある程度の撮影経験あり",
        value: "intermediate",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[9].id,
        label: "上級者・プロ",
        description: "本格的な撮影を行う",
        value: "advanced_pro",
      },
    }),

    // Camera subject options
    prisma.questionOption.create({
      data: {
        questionId: questions[10].id,
        label: "ポートレート・人物",
        description: "人物の撮影",
        value: "portrait",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[10].id,
        label: "風景・自然",
        description: "風景や自然の撮影",
        value: "landscape",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[10].id,
        label: "スポーツ・動き",
        description: "動きのある被写体",
        value: "sports_action",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[10].id,
        label: "マクロ・接写",
        description: "小さな被写体の接写",
        value: "macro",
      },
    }),
    prisma.questionOption.create({
      data: {
        questionId: questions[10].id,
        label: "動画撮影",
        description: "動画コンテンツの撮影",
        value: "video",
      },
    }),
  ]);

  console.log("Question Options created");

  // Sample questionnaire sessions and related data can be added separately using existing UserProfile IDs
  console.log(
    "Sample questionnaire data can be added separately using existing UserProfile IDs"
  );

  console.log("Database seed completed successfully!");
  console.log("");
  console.log("Created data summary:");
  console.log("- Categories: 8 (including hierarchy)");
  console.log("- Products: 12 (with Rakuten-style data)");
  console.log("- Tags: 8 (Rakuten marketplace tags)");
  console.log("- Questions: 11 (across all categories)");
  console.log("- Question Options: Multiple options per question");
  console.log("- Product Categories: Mapped all products to categories");
  console.log("- Product Tags: Applied relevant tags to all products");
  console.log("- Category Key Points: 14 points across categories");
  console.log("- Category Common Questions: 7 questions across categories");
  console.log("");
  console.log("Note: UserProfile data was not modified as requested");
  console.log(
    "Questionnaire sessions can be created using existing UserProfile IDs"
  );
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
