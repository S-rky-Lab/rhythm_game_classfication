import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProposalForm from "@/components/ProposalForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposeEditPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  if (isNaN(id)) {
    notFound();
  }

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      categories: true,
      fieldStatuses: true,
    },
  });

  if (!game) {
    notFound();
  }

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

  const initialData = {
    name: game.name,
    reading: game.reading,
    abbreviation: game.abbreviation,
    developer: game.developer,
    officialUrl: game.officialUrl,
    notes: game.notes,
    categoryOptionIds: game.categories.map((c) => c.categoryOptionId),
    fieldStatuses: game.fieldStatuses.map((fs) => ({
      fieldName: fs.fieldName,
      status: fs.status,
      sourceId: fs.sourceId,
      lastConfirmedAt: fs.lastConfirmedAt ? fs.lastConfirmedAt.toISOString() : null,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/games" className="hover:text-indigo-600 transition">
          ゲーム一覧
        </Link>
        <span>/</span>
        <Link href={`/games/${game.id}`} className="hover:text-indigo-600 transition">
          {game.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-zinc-100 font-medium">修正提案</span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-zinc-50">
          「{game.name}」の修正提案
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          一般ユーザー向けの修正提案画面です。送信された提案は管理者の承認後に反映されます。
        </p>
      </div>

      <ProposalForm
        gameId={game.id}
        initialData={initialData}
        categories={categories}
        sources={sources}
      />
    </div>
  );
}
