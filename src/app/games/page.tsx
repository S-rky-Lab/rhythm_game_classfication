import React from "react";
import { prisma } from "@/lib/prisma";
import SearchFilter from "@/components/SearchFilter";
import GameListWithCompare from "@/components/GameListWithCompare";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GamesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const optionsParam =
    typeof resolvedSearchParams.options === "string"
      ? resolvedSearchParams.options
      : "";
  const selectedOptionIds = optionsParam
    ? optionsParam
        .split(",")
        .map((s) => parseInt(s, 10))
        .filter((n) => !isNaN(n))
    : [];

  // 1. マスタデータ取得
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      options: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  // 2. 検索条件組み立て (Prisma WHERE)
  const whereConditions: any[] = [];

  // キーワード検索 (ゲーム名, 読み, 略称, 開発元, タグ)
  if (q.trim() !== "") {
    whereConditions.push({
      OR: [
        { name: { contains: q.trim() } },
        { reading: { contains: q.trim() } },
        { abbreviation: { contains: q.trim() } },
        { developer: { contains: q.trim() } },
        {
          tags: {
            some: {
              tag: {
                name: { contains: q.trim() },
              },
            },
          },
        },
      ],
    });
  }

  // 分類選択肢フィルタ（指定された各オプションを持つゲームを絞り込み：AND）
  if (selectedOptionIds.length > 0) {
    for (const optId of selectedOptionIds) {
      whereConditions.push({
        categories: {
          some: {
            categoryOptionId: optId,
          },
        },
      });
    }
  }

  // 3. ゲーム一覧取得
  const games = await prisma.game.findMany({
    where: whereConditions.length > 0 ? { AND: whereConditions } : undefined,
    orderBy: { name: "asc" },
    include: {
      categories: {
        include: {
          categoryOption: {
            include: {
              category: true,
            },
          },
        },
      },
      attributes: {
        include: {
          attribute: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      fieldStatuses: {
        include: {
          source: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-zinc-50">
            音楽ゲーム一覧・分類検索
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            プレイスタイル・操作方式・レーン・プラットフォームなどの分類から音ゲーを横断検索
          </p>
        </div>
      </div>

      {/* 検索・絞り込みフォーム */}
      <SearchFilter
        categories={categories}
        currentQuery={q}
        selectedOptionIds={selectedOptionIds}
      />

      {/* ゲーム一覧（比較選択つき） */}
      <GameListWithCompare games={games} />
    </div>
  );
}
