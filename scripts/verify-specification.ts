import { prisma } from "../src/lib/prisma";

async function verifySpecification() {
  console.log("=== specification.md 準拠データ検証 ===");

  // 1. カテゴリマスタの確認
  const categories = await prisma.category.findMany({
    include: { options: { orderBy: { displayOrder: "asc" } } },
    orderBy: { displayOrder: "asc" },
  });
  console.log(`✓ 登録カテゴリ数: ${categories.length}`);
  categories.forEach((c) => {
    console.log(`  - [${c.name}] 選択肢数: ${c.options.length} (${c.options.map((o) => o.name).join(", ")})`);
  });

  const expectedCategories = [
    "プレイスタイル",
    "レーン・ノーツ方式",
    "操作方式",
    "プレイ形態",
    "プラットフォーム",
  ];
  for (const exp of expectedCategories) {
    if (!categories.some((c) => c.name === exp)) {
      throw new Error(`カテゴリ「${exp}」が存在しません`);
    }
  }

  // 2. 登録ゲームの確認
  const games = await prisma.game.findMany({
    include: {
      categories: {
        include: {
          categoryOption: {
            include: { category: true },
          },
        },
      },
      attributes: {
        include: { attribute: true },
      },
    },
    orderBy: { id: "asc" },
  });

  console.log(`\n✓ 登録ゲーム数: ${games.length} 件`);
  games.forEach((g) => {
    const playStyle = g.categories.filter((c) => c.categoryOption.category.name === "プレイスタイル").map((c) => c.categoryOption.name).join(", ");
    const operations = g.categories.filter((c) => c.categoryOption.category.name === "操作方式").map((c) => c.categoryOption.name).join(", ");
    const lanes = g.categories.filter((c) => c.categoryOption.category.name === "レーン・ノーツ方式").map((c) => c.categoryOption.name).join(", ");
    const platforms = g.categories.filter((c) => c.categoryOption.category.name === "プラットフォーム").map((c) => c.categoryOption.name).join(", ");

    console.log(`- ${g.name} (${g.abbreviation || ""}):`);
    console.log(`    プレイスタイル: ${playStyle || "未設定"}`);
    console.log(`    操作方式: ${operations || "未設定"}`);
    console.log(`    レーン・ノーツ方式: ${lanes || "未設定"}`);
    console.log(`    プラットフォーム: ${platforms || "未設定"}`);
  });

  // 3. 「足による操作」の検索確認 (DanceDanceRevolution)
  const footGames = await prisma.game.findMany({
    where: {
      categories: {
        some: {
          categoryOption: {
            name: "足による操作",
          },
        },
      },
    },
  });
  console.log(`\n✓ 「足による操作」の該当件数: ${footGames.length} 件 (${footGames.map((g) => g.name).join(", ")})`);
  if (footGames.length === 0) throw new Error("「足による操作」の音ゲーが見つかりません");

  // 4. 「ボタン」＋「ターンテーブル」の複数操作方式の確認 (IIDX)
  const iidx = games.find((g) => g.name === "beatmania IIDX");
  const iidxOps = iidx?.categories.filter((c) => c.categoryOption.category.name === "操作方式").map((c) => c.categoryOption.name);
  console.log(`✓ beatmania IIDX 操作方式: ${iidxOps?.join(", ")}`);
  if (!iidxOps?.includes("ボタン") || !iidxOps?.includes("ターンテーブル")) {
    throw new Error("IIDXのボタン/ターンテーブル複数選択が不正です");
  }

  console.log("\n=== 全ての specification.md 仕様要件が満たされていることを確認しました ===");
}

verifySpecification()
  .catch((e) => {
    console.error("検証エラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
