import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArchiveTree from "@/components/ArchiveTree";
import { buildArchiveTree } from "@/lib/archive";

/** Loads all games and renders the categorized archive page. */
export default async function ArchivePage() {
  const games = await prisma.game.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      categories: {
        select: {
          categoryOption: {
            select: {
              name: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const archive = buildArchiveTree(games);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            音ゲーアーカイブ
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            プラットフォームと操作方法からゲームを辿れます。
          </p>
        </div>
        <Link
          href="/games"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
        >
          検索一覧へ戻る
        </Link>
      </div>
      <ArchiveTree archive={archive} />
    </div>
  );
}
