import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CompareTable from "@/components/CompareTable";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const idsParam =
    typeof resolvedSearchParams.ids === "string" ? resolvedSearchParams.ids : "";

  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));

  // 指定されたゲームを取得
  const games =
    ids.length > 0
      ? await prisma.game.findMany({
          where: { id: { in: ids } },
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
          },
        })
      : [];

  // 全ゲーム（追加用セレクタ）
  const allGames = await prisma.game.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 全カテゴリ（表示順）
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/games" className="hover:text-indigo-600 transition">
          ゲーム一覧
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-zinc-100 font-medium">ゲーム比較</span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-zinc-50">
          音楽ゲーム 横断比較
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          2つ以上のタイトルを選択して、プレイスタイル・操作方式・レーン・プラットフォームなどの相違点を比較します。
        </p>
      </div>

      <CompareTable
        games={games}
        allGames={allGames}
        allCategories={allCategories}
      />
    </div>
  );
}
