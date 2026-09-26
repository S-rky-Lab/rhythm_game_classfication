import React from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import SearchFilter from "@/components/SearchFilter";
import GameListWithCompare from "@/components/GameListWithCompare";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GamesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const requestedPage =
    typeof resolvedSearchParams.page === "string" &&
    /^\d+$/.test(resolvedSearchParams.page)
      ? Math.max(1, Number(resolvedSearchParams.page))
      : 1;
  const pageSize = 20;
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

  // 1. 検索条件組み立て (Prisma WHERE)
  const whereConditions: Prisma.GameWhereInput[] = [];

  // キーワード検索 (ゲーム名, 読み, 略称, 開発元)
  if (q.trim() !== "") {
    whereConditions.push({
      OR: [
        { name: { contains: q.trim(), mode: "insensitive" } },
        { reading: { contains: q.trim(), mode: "insensitive" } },
        { abbreviation: { contains: q.trim(), mode: "insensitive" } },
        { developer: { contains: q.trim(), mode: "insensitive" } },
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

  const where =
    whereConditions.length > 0 ? { AND: whereConditions } : undefined;
  const [categories, totalCount] = await Promise.all([
    prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        options: {
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    prisma.game.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const currentPage = Math.min(requestedPage, Math.max(totalPages, 1));

  // 2. 現在のページに表示するゲーム一覧を取得
  const games = await prisma.game.findMany({
    where,
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    orderBy: [{ name: "asc" }, { id: "asc" }],
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
      fieldStatuses: {
        include: {
          source: true,
        },
      },
    },
  });

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (selectedOptionIds.length > 0) {
      params.set("options", selectedOptionIds.join(","));
    }
    params.set("page", String(page));
    return `/games?${params.toString()}`;
  };

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
      <GameListWithCompare
        games={games}
        totalCount={totalCount}
        resultStart={totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
      />

      {totalPages > 1 && (
        <nav
          aria-label="ゲーム一覧のページ"
          className="flex items-center justify-center gap-4 text-sm"
        >
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              前へ
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 px-3 py-2 text-gray-400 dark:border-zinc-800">
              前へ
            </span>
          )}
          <span aria-current="page" className="text-gray-600 dark:text-gray-300">
            {currentPage} / {totalPages} ページ
          </span>
          {currentPage < totalPages ? (
            <Link
              href={pageHref(currentPage + 1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800"
            >
              次へ
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 px-3 py-2 text-gray-400 dark:border-zinc-800">
              次へ
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
