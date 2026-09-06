"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GameFormData } from "@/lib/actions/games";

export interface ProposalInput {
  gameId?: number | null;
  type: "create" | "update";
  proposedData: GameFormData;
  submittedBy?: string;
  comment?: string;
}

export async function submitProposal(input: ProposalInput) {
  if (!input.proposedData.name || input.proposedData.name.trim() === "") {
    throw new Error("ゲーム名は必須です");
  }

  const proposal = await prisma.proposal.create({
    data: {
      gameId: input.gameId || null,
      type: input.type,
      proposedData: JSON.stringify(input.proposedData),
      status: "pending",
      submittedBy: input.submittedBy?.trim() || "一般ユーザー",
      comment: input.comment?.trim() || null,
    },
  });

  try {
    revalidatePath("/admin/proposals");
  } catch (e) {
    // ignore outside Next.js request context
  }
  return proposal;
}

export async function approveProposal(proposalId: number) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) throw new Error("対象の提案が見つかりません");
  if (proposal.status !== "pending") throw new Error("既に処理済みの提案です");

  const data: GameFormData = JSON.parse(proposal.proposedData);

  await prisma.$transaction(async (tx) => {
    let targetGameId = proposal.gameId;

    if (proposal.type === "create" || !targetGameId) {
      // 新規作成提案の承認
      const game = await tx.game.create({
        data: {
          name: data.name.trim(),
          reading: data.reading?.trim() || null,
          abbreviation: data.abbreviation?.trim() || null,
          developer: data.developer?.trim() || null,
          officialUrl: data.officialUrl?.trim() || null,
          notes: data.notes?.trim() || null,
        },
      });
      targetGameId = game.id;
    } else {
      // 既存ゲーム更新提案の承認
      await tx.game.update({
        where: { id: targetGameId },
        data: {
          name: data.name.trim(),
          reading: data.reading?.trim() || null,
          abbreviation: data.abbreviation?.trim() || null,
          developer: data.developer?.trim() || null,
          officialUrl: data.officialUrl?.trim() || null,
          notes: data.notes?.trim() || null,
        },
      });
    }

    // 分類項目差し替え
    await tx.gameCategory.deleteMany({ where: { gameId: targetGameId } });
    if (data.categoryOptionIds && data.categoryOptionIds.length > 0) {
      await tx.gameCategory.createMany({
        data: data.categoryOptionIds.map((optId) => ({
          gameId: targetGameId!,
          categoryOptionId: optId,
        })),
      });
    }

    // 属性差し替え
    await tx.gameAttribute.deleteMany({ where: { gameId: targetGameId } });
    if (data.attributes && data.attributes.length > 0) {
      const validAttrs = data.attributes.filter((a) => a.value && a.value.trim() !== "");
      if (validAttrs.length > 0) {
        await tx.gameAttribute.createMany({
          data: validAttrs.map((a) => ({
            gameId: targetGameId!,
            attributeId: a.attributeId,
            value: a.value.trim(),
          })),
        });
      }
    }

    // タグ差し替え
    await tx.gameTag.deleteMany({ where: { gameId: targetGameId } });
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        const cleanName = tagName.trim();
        if (!cleanName) continue;
        const tag = await tx.tag.upsert({
          where: { name: cleanName },
          update: {},
          create: { name: cleanName },
        });
        await tx.gameTag.create({
          data: {
            gameId: targetGameId!,
            tagId: tag.id,
          },
        });
      }
    }

    // ステータス差し替え
    await tx.gameFieldStatus.deleteMany({ where: { gameId: targetGameId } });
    if (data.fieldStatuses && data.fieldStatuses.length > 0) {
      const validStatuses = data.fieldStatuses.filter((s) => s.status);
      if (validStatuses.length > 0) {
        await tx.gameFieldStatus.createMany({
          data: validStatuses.map((s) => ({
            gameId: targetGameId!,
            fieldName: s.fieldName,
            status: s.status,
            sourceId: s.sourceId || null,
            lastConfirmedAt: s.lastConfirmedAt ? new Date(s.lastConfirmedAt) : null,
          })),
        });
      }
    }

    // 提案ステータス更新
    await tx.proposal.update({
      where: { id: proposalId },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        gameId: targetGameId,
      },
    });

    // 履歴記録
    await tx.history.create({
      data: {
        gameId: targetGameId!,
        changedField: "proposal_approved",
        newValue: `提案 #${proposalId} (提案者: ${proposal.submittedBy || "一般"}) を承認・反映`,
        changedBy: "admin",
      },
    });
  });

  try {
    revalidatePath("/admin/proposals");
    revalidatePath("/games");
  } catch (e) {
    // ignore outside Next.js request context
  }
}

export async function rejectProposal(proposalId: number) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
  });

  if (!proposal) throw new Error("対象の提案が見つかりません");
  if (proposal.status !== "pending") throw new Error("既に処理済みの提案です");

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
    },
  });

  try {
    revalidatePath("/admin/proposals");
  } catch (e) {
    // ignore outside Next.js request context
  }
}
