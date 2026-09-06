import { prisma } from "../src/lib/prisma";

async function verifySimilarGames() {
  console.log("=== 類似音ゲーロジックの動作検証 ===");

  const chunithm = await prisma.game.findFirst({
    where: { name: "CHUNITHM" },
    include: {
      categories: true,
      tags: true,
    },
  });

  if (!chunithm) throw new Error("CHUNITHMが見つかりません");

  const cOptIds = new Set(chunithm.categories.map((c) => c.categoryOptionId));
  const cTagIds = new Set(chunithm.tags.map((t) => t.tagId));

  const otherGames = await prisma.game.findMany({
    where: { id: { not: chunithm.id } },
    include: {
      categories: {
        include: {
          categoryOption: {
            include: { category: true },
          },
        },
      },
      tags: { include: { tag: true } },
    },
  });

  const similarList = otherGames.map((other) => {
    let score = 0;
    const common: string[] = [];

    other.categories.forEach((oc) => {
      if (cOptIds.has(oc.categoryOptionId)) {
        score += 2;
        common.push(`${oc.categoryOption.category.name}:${oc.categoryOption.name}`);
      }
    });

    other.tags.forEach((ot) => {
      if (cTagIds.has(ot.tagId)) {
        score += 1;
        common.push(`#${ot.tag.name}`);
      }
    });

    return { name: other.name, score, common };
  });

  similarList.sort((a, b) => b.score - a.score);

  console.log(`対象: ${chunithm.name}`);
  similarList.forEach((s) => {
    console.log(`- 類似ゲーム: ${s.name} (スコア: ${s.score}) 共通点: [${s.common.join(", ")}]`);
  });

  if (similarList.length === 0 || similarList[0].score === 0) {
    throw new Error("類似ゲームが算出されませんでした");
  }

  console.log("✓ 類似音ゲー探索ロジック検証成功！");
}

verifySimilarGames()
  .catch((e) => {
    console.error("検証失敗:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
