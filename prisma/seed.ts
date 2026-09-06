import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "node:path";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: path.join(process.cwd(), "prisma", "dev.db"),
  }),
});

type CategoryWithOptions = {
  name: string;
  options: Array<{ id: number; name: string }>;
};

async function main() {
  console.log("Seeding database without detailed attributes...");

  // クリーンアップ
  await prisma.proposal.deleteMany();
  await prisma.history.deleteMany();
  await prisma.gameFieldStatus.deleteMany();
  await prisma.gameRelation.deleteMany();
  await prisma.gameTag.deleteMany();
  await prisma.gameAttribute.deleteMany();
  await prisma.gameCategory.deleteMany();
  await prisma.categoryOption.deleteMany();
  await prisma.category.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.source.deleteMany();
  await prisma.user.deleteMany();
  await prisma.game.deleteMany();

  // 1. ユーザー作成
  await prisma.user.create({
    data: { name: "管理者", role: "admin" },
  });
  await prisma.user.create({
    data: { name: "編集者", role: "editor" },
  });
  await prisma.user.create({
    data: { name: "一般ユーザー", role: "viewer" },
  });

  // 2. 情報源 (Sources)
  const srcOfficial = await prisma.source.create({
    data: { name: "公式サイト", url: "https://example.com/official", type: "公式サイト" },
  });
  const srcInGame = await prisma.source.create({
    data: { name: "ゲーム内実機確認", url: null, type: "ゲーム内情報" },
  });

  // ==========================================
  // 3. specification.md 第5章 分類項目 (Categories)
  // ==========================================

  // 5.1 プレイスタイル
  const catPlayStyle = await prisma.category.create({
    data: {
      name: "プレイスタイル",
      displayOrder: 1,
      options: {
        create: [
          { name: "手による操作", displayOrder: 1 },
          { name: "足による操作", displayOrder: 2 },
          { name: "手足を組み合わせた操作", displayOrder: 3 },
          { name: "その他", displayOrder: 4 },
        ],
      },
    },
    include: { options: true },
  });

  // 5.2 レーン・ノーツ方式
  const catLane = await prisma.category.create({
    data: {
      name: "レーン・ノーツ方式",
      displayOrder: 2,
      options: {
        create: [
          { name: "固定レーン型", displayOrder: 1 },
          { name: "自由レーン型（降下レーン可動）", displayOrder: 2 },
          { name: "自由レーン型（レーン可動・変形）", displayOrder: 3 },
          { name: "レーンなし型", displayOrder: 4 },
          { name: "その他", displayOrder: 5 },
        ],
      },
    },
    include: { options: true },
  });

  // 5.3 操作方式
  const catOperation = await prisma.category.create({
    data: {
      name: "操作方式",
      displayOrder: 3,
      options: {
        create: [
          { name: "ボタン", displayOrder: 1 },
          { name: "キーボード", displayOrder: 2 },
          { name: "タッチ", displayOrder: 3 },
          { name: "スライダー", displayOrder: 4 },
          { name: "ターンテーブル", displayOrder: 5 },
          { name: "足", displayOrder: 6 },
          { name: "マウス", displayOrder: 7 },
          { name: "その他", displayOrder: 8 },
        ],
      },
    },
    include: { options: true },
  });

  // 5.4 プレイ形態
  const catPlayMode = await prisma.category.create({
    data: {
      name: "プレイ形態",
      displayOrder: 4,
      options: {
        create: [
          { name: "SP(シングルプレイ)", displayOrder: 1 },
          { name: "DP(ダブルプレイ)", displayOrder: 2 },
        ],
      },
    },
    include: { options: true },
  });

  // 5.5 プラットフォーム
  const catPlatform = await prisma.category.create({
    data: {
      name: "プラットフォーム",
      displayOrder: 5,
      options: {
        create: [
          { name: "アーケード", displayOrder: 1 },
          { name: "Windows", displayOrder: 2 },
          { name: "iOS", displayOrder: 3 },
          { name: "Android", displayOrder: 4 },
          { name: "Nintendo Switch", displayOrder: 5 },
          { name: "PlayStation", displayOrder: 6 },
          { name: "Xbox", displayOrder: 7 },
          { name: "Web", displayOrder: 8 },
          { name: "MacOS", displayOrder: 9 },
          { name: "Linux", displayOrder: 10 },
        ],
      },
    },
    include: { options: true },
  });

  // ==========================================
  // 4. タグマスタ (Tags)
  // ==========================================
  const tagNames = [
    "BEMANI",
    "SEGA",
    "ゲキチュウマイ",
    "スマホ音ゲー",
    "ボカロ",
    "DJ",
    "鍵盤",
    "足",
    "ダンス",
    "和太鼓",
    "高難易度",
    "アーケード",
  ];
  const tags: Record<string, { id: number; name: string }> = {};
  for (const name of tagNames) {
    const tag = await prisma.tag.create({ data: { name } });
    tags[name] = tag;
  }

  // ヘルパー: オプションID取得
  const getOptId = (cat: CategoryWithOptions, optName: string) => {
    const found = cat.options.find((option) => option.name === optName);
    if (!found) throw new Error(`Option ${optName} not found in ${cat.name}`);
    return found.id;
  };

  // ==========================================
  // 5. サンプルゲーム登録（詳細属性なし）
  // ==========================================

  // --- 1. beatmania IIDX ---
  const game1 = await prisma.game.create({
    data: {
      name: "beatmania IIDX",
      reading: "ビートマニア ツーディーエックス",
      abbreviation: "IIDX / 弐寺",
      developer: "KONAMI",
      officialUrl: "https://p.eagate.573.jp/game/2dx/",
      notes: "アーケード向け本格DJシミュレーション音楽ゲーム。7つの鍵盤とターンテーブルを駆使してプレイする。",
      categories: {
        create: [
          { categoryOptionId: getOptId(catPlayStyle, "手による操作") },
          { categoryOptionId: getOptId(catLane, "固定レーン型") },
          { categoryOptionId: getOptId(catOperation, "ボタン") },
          { categoryOptionId: getOptId(catOperation, "ターンテーブル") },
          { categoryOptionId: getOptId(catPlayMode, "SP(シングルプレイ)") },
          { categoryOptionId: getOptId(catPlayMode, "DP(ダブルプレイ)") },
          { categoryOptionId: getOptId(catPlatform, "アーケード") },
          { categoryOptionId: getOptId(catPlatform, "Windows") },
        ],
      },
      tags: {
        create: [
          { tagId: tags["BEMANI"].id },
          { tagId: tags["DJ"].id },
          { tagId: tags["鍵盤"].id },
          { tagId: tags["高難易度"].id },
          { tagId: tags["アーケード"].id },
        ],
      },
      fieldStatuses: {
        create: [
          {
            fieldName: "official_url",
            status: "confirmed",
            sourceId: srcOfficial.id,
            lastConfirmedAt: new Date(),
          },
          {
            fieldName: "categories.プレイスタイル",
            status: "confirmed",
            sourceId: srcInGame.id,
            lastConfirmedAt: new Date(),
          },
        ],
      },
    },
  });

  // --- 2. CHUNITHM ---
  const game2 = await prisma.game.create({
    data: {
      name: "CHUNITHM",
      reading: "チュウニズム",
      abbreviation: "ウニ / チュウニ",
      developer: "SEGA",
      officialUrl: "https://chunithm.sega.jp/",
      notes: "グラウンドスライダーと空間エアセンサーで直感的に演奏する空間型音ゲー。",
      categories: {
        create: [
          { categoryOptionId: getOptId(catPlayStyle, "手による操作") },
          { categoryOptionId: getOptId(catLane, "自由レーン型（レーン可動・変形）") },
          { categoryOptionId: getOptId(catOperation, "スライダー") },
          { categoryOptionId: getOptId(catOperation, "その他") },
          { categoryOptionId: getOptId(catPlayMode, "SP(シングルプレイ)") },
          { categoryOptionId: getOptId(catPlatform, "アーケード") },
        ],
      },
      tags: {
        create: [
          { tagId: tags["SEGA"].id },
          { tagId: tags["ゲキチュウマイ"].id },
          { tagId: tags["アーケード"].id },
        ],
      },
      fieldStatuses: {
        create: [
          {
            fieldName: "official_url",
            status: "confirmed",
            sourceId: srcOfficial.id,
            lastConfirmedAt: new Date(),
          },
        ],
      },
    },
  });

  // --- 3. maimai でらっくす ---
  const game3 = await prisma.game.create({
    data: {
      name: "maimai でらっくす",
      reading: "マイマイ デラックス",
      abbreviation: "まいまい / 舞",
      developer: "SEGA",
      officialUrl: "https://maimai.sega.jp/",
      notes: "大型円形画面の周囲にある8個のボタンとタッチスクリーンを操作して演奏する音楽ゲーム。",
      categories: {
        create: [
          { categoryOptionId: getOptId(catPlayStyle, "手による操作") },
          { categoryOptionId: getOptId(catLane, "その他") },
          { categoryOptionId: getOptId(catOperation, "ボタン") },
          { categoryOptionId: getOptId(catOperation, "タッチ") },
          { categoryOptionId: getOptId(catPlayMode, "SP(シングルプレイ)") },
          { categoryOptionId: getOptId(catPlatform, "アーケード") },
        ],
      },
      tags: {
        create: [
          { tagId: tags["SEGA"].id },
          { tagId: tags["ゲキチュウマイ"].id },
          { tagId: tags["アーケード"].id },
        ],
      },
      fieldStatuses: {
        create: [
          {
            fieldName: "official_url",
            status: "confirmed",
            sourceId: srcOfficial.id,
            lastConfirmedAt: new Date(),
          },
        ],
      },
    },
  });

  // --- 4. プロジェクトセカイ カラフルステージ！ feat. 初音ミク ---
  await prisma.game.create({
    data: {
      name: "プロジェクトセカイ カラフルステージ！ feat. 初音ミク",
      reading: "プロジェクトセカイ カラフルステージ フィーチャリング ハツネミク",
      abbreviation: "プロセカ",
      developer: "Colorful Palette / SEGA",
      officialUrl: "https://pjsekai.sega.jp/",
      notes: "初音ミクやバーチャル・シンガーとオリジナルキャラクターが登場するスマートフォン向けリズムゲーム。",
      categories: {
        create: [
          { categoryOptionId: getOptId(catPlayStyle, "手による操作") },
          { categoryOptionId: getOptId(catLane, "固定レーン型") },
          { categoryOptionId: getOptId(catOperation, "タッチ") },
          { categoryOptionId: getOptId(catPlayMode, "SP(シングルプレイ)") },
          { categoryOptionId: getOptId(catPlatform, "iOS") },
          { categoryOptionId: getOptId(catPlatform, "Android") },
        ],
      },
      tags: {
        create: [
          { tagId: tags["スマホ音ゲー"].id },
          { tagId: tags["ボカロ"].id },
          { tagId: tags["SEGA"].id },
        ],
      },
      fieldStatuses: {
        create: [
          {
            fieldName: "official_url",
            status: "confirmed",
            sourceId: srcOfficial.id,
            lastConfirmedAt: new Date(),
          },
        ],
      },
    },
  });

  // --- 5. 太鼓の達人 ---
  await prisma.game.create({
    data: {
      name: "太鼓の達人",
      reading: "タイコノタツジン",
      abbreviation: "太鼓",
      developer: "バンダイナムコエンターテインメント",
      officialUrl: "https://taiko.namco-ch.net/taiko/",
      notes: "和太鼓をバチで叩いて演奏する国民的人気音楽ゲーム。面とフチの叩き分けで演奏する。",
      categories: {
        create: [
          { categoryOptionId: getOptId(catPlayStyle, "手による操作") },
          { categoryOptionId: getOptId(catLane, "その他") },
          { categoryOptionId: getOptId(catOperation, "その他") },
          { categoryOptionId: getOptId(catPlayMode, "SP(シングルプレイ)") },
          { categoryOptionId: getOptId(catPlatform, "アーケード") },
          { categoryOptionId: getOptId(catPlatform, "Nintendo Switch") },
          { categoryOptionId: getOptId(catPlatform, "PlayStation") },
          { categoryOptionId: getOptId(catPlatform, "Xbox") },
          { categoryOptionId: getOptId(catPlatform, "Windows") },
          { categoryOptionId: getOptId(catPlatform, "iOS") },
          { categoryOptionId: getOptId(catPlatform, "Android") },
        ],
      },
      tags: {
        create: [
          { tagId: tags["和太鼓"].id },
          { tagId: tags["アーケード"].id },
        ],
      },
      fieldStatuses: {
        create: [
          {
            fieldName: "official_url",
            status: "confirmed",
            sourceId: srcOfficial.id,
            lastConfirmedAt: new Date(),
          },
        ],
      },
    },
  });

  // --- 6. DanceDanceRevolution ---
  const game6 = await prisma.game.create({
    data: {
      name: "DanceDanceRevolution",
      reading: "ダンスダンスレボリューション",
      abbreviation: "DDR",
      developer: "KONAMI",
      officialUrl: "https://p.eagate.573.jp/game/ddr/",
      notes: "4方向のフットパネルを音楽に合わせて足で踏んでプレイするダンスシミュレーション音ゲーの元祖。",
      categories: {
        create: [
          { categoryOptionId: getOptId(catPlayStyle, "足による操作") },
          { categoryOptionId: getOptId(catLane, "固定レーン型") },
          { categoryOptionId: getOptId(catOperation, "足") },
          { categoryOptionId: getOptId(catPlayMode, "SP(シングルプレイ)") },
          { categoryOptionId: getOptId(catPlayMode, "DP(ダブルプレイ)") },
          { categoryOptionId: getOptId(catPlatform, "アーケード") },
          { categoryOptionId: getOptId(catPlatform, "PlayStation") },
          { categoryOptionId: getOptId(catPlatform, "Web") },
        ],
      },
      tags: {
        create: [
          { tagId: tags["BEMANI"].id },
          { tagId: tags["足"].id },
          { tagId: tags["ダンス"].id },
          { tagId: tags["アーケード"].id },
        ],
      },
      fieldStatuses: {
        create: [
          {
            fieldName: "official_url",
            status: "confirmed",
            sourceId: srcOfficial.id,
            lastConfirmedAt: new Date(),
          },
        ],
      },
    },
  });

  // 6. ゲーム関連付け
  await prisma.gameRelation.create({
    data: {
      gameId: game2.id,
      relatedGameId: game3.id,
      relationType: "同社音ゲー（ゲキチュウマイシリーズ・楽曲連動）",
    },
  });
  await prisma.gameRelation.create({
    data: {
      gameId: game1.id,
      relatedGameId: game6.id,
      relationType: "同社BEMANIシリーズ（連動イベント等）",
    },
  });

  console.log("Database seeded successfully without attributes!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
