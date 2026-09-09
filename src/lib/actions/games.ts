"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export interface GameFormData {
  name: string;
  reading?: string;
  abbreviation?: string;
  developer?: string;
  officialUrl?: string;
  notes?: string;
  categoryOptionIds: number[];
  attributes: { attributeId: number; value: string }[];
  fieldStatuses: {
    fieldName: string;
    status: string;
    sourceId?: number | null;
    lastConfirmedAt?: string | null;
  }[];
}

export async function createGame(data: GameFormData) {
  if (!data.name || data.name.trim() === "") {
    throw new Error("ゲーム名は必須です");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. ゲーム本体作成
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

    // 2. 分類項目の紐付け
    if (data.categoryOptionIds && data.categoryOptionIds.length > 0) {
      await tx.gameCategory.createMany({
        data: data.categoryOptionIds.map((optId) => ({
          gameId: game.id,
          categoryOptionId: optId,
        })),
      });
    }

    // 3. 詳細属性の保存
    if (data.attributes && data.attributes.length > 0) {
      const validAttrs = data.attributes.filter((a) => a.value && a.value.trim() !== "");
      if (validAttrs.length > 0) {
        await tx.gameAttribute.createMany({
          data: validAttrs.map((a) => ({
            gameId: game.id,
            attributeId: a.attributeId,
            value: a.value.trim(),
          })),
        });
      }
    }

    // 4. 情報状態 (FieldStatuses) の保存
    if (data.fieldStatuses && data.fieldStatuses.length > 0) {
      const validStatuses = data.fieldStatuses.filter((s) => s.status);
      if (validStatuses.length > 0) {
        await tx.gameFieldStatus.createMany({
          data: validStatuses.map((s) => ({
            gameId: game.id,
            fieldName: s.fieldName,
            status: s.status,
            sourceId: s.sourceId || null,
            lastConfirmedAt: s.lastConfirmedAt ? new Date(s.lastConfirmedAt) : null,
          })),
        });
      }
    }

    // 5. 履歴記録
    await tx.history.create({
      data: {
        gameId: game.id,
        changedField: "created",
        newValue: `ゲーム「${game.name}」を作成`,
        changedBy: "user",
      },
    });

    return game;
  });

  try {
    revalidatePath("/games");
  } catch (e) {}
  redirect(`/games/${result.id}`);
}

export async function updateGame(gameId: number, data: GameFormData) {
  if (!data.name || data.name.trim() === "") {
    throw new Error("ゲーム名は必須です");
  }

  await prisma.$transaction(async (tx) => {
    // 既存データ取得
    const existing = await tx.game.findUnique({ where: { id: gameId } });
    if (!existing) throw new Error("対象のゲームが見つかりません");

    // 1. ゲーム本体更新
    await tx.game.update({
      where: { id: gameId },
      data: {
        name: data.name.trim(),
        reading: data.reading?.trim() || null,
        abbreviation: data.abbreviation?.trim() || null,
        developer: data.developer?.trim() || null,
        officialUrl: data.officialUrl?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    // 2. 分類項目を全差し替え
    await tx.gameCategory.deleteMany({ where: { gameId } });
    if (data.categoryOptionIds && data.categoryOptionIds.length > 0) {
      await tx.gameCategory.createMany({
        data: data.categoryOptionIds.map((optId) => ({
          gameId,
          categoryOptionId: optId,
        })),
      });
    }

    // 3. 属性を全差し替え
    await tx.gameAttribute.deleteMany({ where: { gameId } });
    if (data.attributes && data.attributes.length > 0) {
      const validAttrs = data.attributes.filter((a) => a.value && a.value.trim() !== "");
      if (validAttrs.length > 0) {
        await tx.gameAttribute.createMany({
          data: validAttrs.map((a) => ({
            gameId,
            attributeId: a.attributeId,
            value: a.value.trim(),
          })),
        });
      }
    }

    // 4. ステータス差し替え
    await tx.gameFieldStatus.deleteMany({ where: { gameId } });
    if (data.fieldStatuses && data.fieldStatuses.length > 0) {
      const validStatuses = data.fieldStatuses.filter((s) => s.status);
      if (validStatuses.length > 0) {
        await tx.gameFieldStatus.createMany({
          data: validStatuses.map((s) => ({
            gameId,
            fieldName: s.fieldName,
            status: s.status,
            sourceId: s.sourceId || null,
            lastConfirmedAt: s.lastConfirmedAt ? new Date(s.lastConfirmedAt) : null,
          })),
        });
      }
    }

    // 5. 履歴記録
    await tx.history.create({
      data: {
        gameId,
        changedField: "updated",
        newValue: `ゲーム「${data.name}」の情報を更新`,
        changedBy: "user",
      },
    });
  });

  try {
    revalidatePath(`/games/${gameId}`);
    revalidatePath("/games");
  } catch (e) {}
  redirect(`/games/${gameId}`);
}
