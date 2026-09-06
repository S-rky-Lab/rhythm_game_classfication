import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProposalListManager from "@/components/ProposalListManager";

export default async function AdminProposalsPage() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      game: {
        select: { id: true, name: true },
      },
    },
  });

  const categories = await prisma.category.findMany({
    include: {
      options: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/games" className="hover:text-indigo-600 transition">
          ゲーム一覧
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-zinc-100 font-medium">管理者メニュー</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-zinc-100 font-medium">提案承認</span>
      </div>

      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-zinc-50">
          修正提案の確認・承認
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          一般ユーザーから送信された修正提案・情報追加リクエストを確認し、ワンクリックでデータベースへ反映できます。
        </p>
      </div>

      <ProposalListManager
        proposals={proposals}
        allCategories={categories}
      />
    </div>
  );
}
