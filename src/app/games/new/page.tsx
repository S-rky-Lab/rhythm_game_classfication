import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import GameForm from "@/components/GameForm";

export default async function NewGamePage() {
  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      options: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  const sources = await prisma.source.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/games" className="hover:text-indigo-600 transition">
          ゲーム一覧
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-zinc-100 font-medium">新規登録</span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-zinc-50">
          新規音楽ゲーム登録
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          基本情報やゲームシステム・操作方式・プラットフォームの分類、情報源を入力してください。
        </p>
      </div>

      <GameForm
        mode="create"
        categories={categories}
        sources={sources}
      />
    </div>
  );
}
