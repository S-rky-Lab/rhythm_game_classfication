import { prisma } from "../src/lib/prisma";
import { submitProposal, approveProposal } from "../src/lib/actions/proposals";

async function runVerification() {
  console.log("=== 音ゲー分類アプリ 動作検証スクリプト開始 ===");

  // 1. シードデータ確認
  const games = await prisma.game.findMany({
    include: {
      categories: { include: { categoryOption: { include: { category: true } } } },
      attributes: { include: { attribute: true } },
      fieldStatuses: true,
    },
  });
  console.log(`✓ 登録済みゲーム数: ${games.length} 件`);
  if (games.length < 5) throw new Error("ゲーム数が不足しています");

  // 2. キーワード検索の検証
  const searchIIDX = await prisma.game.findMany({
    where: {
      OR: [
        { name: { contains: "IIDX" } },
        { abbreviation: { contains: "IIDX" } },
      ],
    },
  });
  console.log(`✓ キーワード「IIDX」検索ヒット数: ${searchIIDX.length} 件 (名前: ${searchIIDX[0]?.name})`);
  if (searchIIDX.length === 0) throw new Error("IIDXが検索で見つかりません");

  // 3. 分類条件検索の検証 (「鍵盤（ターンテーブル付き）」のオプションID)
  const keyboardOpt = await prisma.categoryOption.findFirst({
    where: { name: "鍵盤（ターンテーブル付き）" },
  });
  if (!keyboardOpt) throw new Error("分類オプションが見つかりません");

  const gamesWithKeyboard = await prisma.game.findMany({
    where: {
      categories: {
        some: { categoryOptionId: keyboardOpt.id },
      },
    },
  });
  console.log(`✓ 分類「鍵盤（ターンテーブル付き）」での絞り込みヒット数: ${gamesWithKeyboard.length} 件`);
  if (gamesWithKeyboard.length === 0) throw new Error("分類絞り込みに失敗しました");

  // 4. 修正提案・承認フローの検証
  const testGame = games[0];
  console.log(`✓ テスト対象ゲーム: ${testGame.name} (ID: ${testGame.id})`);

  const proposal = await submitProposal({
    gameId: testGame.id,
    type: "update",
    submittedBy: "自動テストユーザー",
    comment: "略称に「beat」を追加する提案テスト",
    proposedData: {
      name: testGame.name,
      reading: testGame.reading || undefined,
      abbreviation: `${testGame.abbreviation} / テスト略称`,
      developer: testGame.developer || undefined,
      officialUrl: testGame.officialUrl || undefined,
      notes: testGame.notes || undefined,
      categoryOptionIds: testGame.categories.map((c) => c.categoryOptionId),
      attributes: testGame.attributes.map((a) => ({
        attributeId: a.attributeId,
        value: a.value,
      })),
      fieldStatuses: testGame.fieldStatuses.map((fs) => ({
        fieldName: fs.fieldName,
        status: fs.status,
        sourceId: fs.sourceId,
        lastConfirmedAt: fs.lastConfirmedAt ? fs.lastConfirmedAt.toISOString() : null,
      })),
    },
  });
  console.log(`✓ 修正提案を作成しました (Proposal ID: ${proposal.id}, status: ${proposal.status})`);

  // 提案承認
  await approveProposal(proposal.id);
  console.log(`✓ 修正提案を承認しました`);

  // 反映確認
  const updatedGame = await prisma.game.findUnique({
    where: { id: testGame.id },
    include: { histories: true },
  });
  console.log(`✓ 反映後の略称: ${updatedGame?.abbreviation}`);
  if (!updatedGame?.abbreviation?.includes("テスト略称")) {
    throw new Error("提案承認の反映に失敗しました");
  }

  // 履歴確認
  const latestHistory = updatedGame.histories[updatedGame.histories.length - 1];
  console.log(`✓ 更新履歴ログ: [${latestHistory?.changedField}] ${latestHistory?.newValue}`);

  // テストデータのクリーンアップ（略称を元に戻す）
  await prisma.game.update({
    where: { id: testGame.id },
    data: { abbreviation: testGame.abbreviation },
  });
  await prisma.proposal.delete({ where: { id: proposal.id } });
  console.log(`✓ テストデータクリーンアップ完了`);

  console.log("=== 全検証項目が正常にパスしました ===");
}

runVerification()
  .catch((e) => {
    console.error("検証失敗:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
