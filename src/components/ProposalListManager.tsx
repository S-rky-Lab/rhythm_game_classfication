"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { approveProposal, rejectProposal } from "@/lib/actions/proposals";
import { GameFormData } from "@/lib/actions/games";

interface ProposalItem {
  id: number;
  gameId: number | null;
  type: string;
  proposedData: string;
  status: string;
  submittedBy: string | null;
  comment: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  game: {
    id: number;
    name: string;
  } | null;
}

interface ProposalListManagerProps {
  proposals: ProposalItem[];
  allCategories: { id: number; name: string; options: { id: number; name: string }[] }[];
}

export default function ProposalListManager({
  proposals,
  allCategories,
}: ProposalListManagerProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: number) => {
    if (confirm("この提案を承認してゲーム情報に反映しますか？")) {
      startTransition(async () => {
        await approveProposal(id);
      });
    }
  };

  const handleReject = (id: number) => {
    if (confirm("この提案を却下しますか？")) {
      startTransition(async () => {
        await rejectProposal(id);
      });
    }
  };

  // オプションIDから名称を逆引きするマップ
  const optNameMap = new Map<number, { catName: string; optName: string }>();
  allCategories.forEach((cat) => {
    cat.options.forEach((opt) => {
      optNameMap.set(opt.id, { catName: cat.name, optName: opt.name });
    });
  });

  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const processedProposals = proposals.filter((p) => p.status !== "pending");

  return (
    <div className="space-y-8">
      {/* 承認待ちセクション */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <span>承認待ち提案</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
            {pendingProposals.length} 件
          </span>
        </h2>

        {pendingProposals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 text-sm text-gray-500">
            現在、承認待ちの提案はありません。
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProposals.map((prop) => {
              let parsedData: GameFormData | null = null;
              try {
                parsedData = JSON.parse(prop.proposedData);
              } catch (e) {
                // invalid JSON
              }

              return (
                <div
                  key={prop.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-6 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          {prop.type === "create" ? "新規登録提案" : "修正提案"}
                        </span>
                        <span className="text-xs text-gray-400">
                          提案ID #{prop.id} · {new Date(prop.createdAt).toLocaleString("ja-JP")}
                        </span>
                      </div>
                      <div className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-1">
                        対象: {prop.game ? (
                          <Link href={`/games/${prop.game.id}`} className="text-indigo-600 hover:underline">
                            {prop.game.name}
                          </Link>
                        ) : (
                          parsedData?.name || "新規ゲーム"
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleReject(prop.id)}
                        className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition cursor-pointer"
                      >
                        却下する
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApprove(prop.id)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>承認して反映</span>
                        <span>&check;</span>
                      </button>
                    </div>
                  </div>

                  {/* 提案者コメント */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl text-xs space-y-1">
                    <div className="text-amber-800 dark:text-amber-300 font-semibold">
                      提案者: {prop.submittedBy || "匿名"}
                    </div>
                    {prop.comment && (
                      <div className="text-gray-700 dark:text-gray-300">
                        コメント: {prop.comment}
                      </div>
                    )}
                  </div>

                  {/* 提案内容プレビュー */}
                  {parsedData && (
                    <div className="text-xs space-y-2 pt-1">
                      <h4 className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                        提案されたデータ内容
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 dark:bg-zinc-800/40 p-3 rounded-xl text-gray-700 dark:text-gray-300">
                        <div>
                          <span className="text-gray-400 mr-1">ゲーム名:</span>
                          <span className="font-bold">{parsedData.name}</span>
                        </div>
                        {parsedData.reading && (
                          <div>
                            <span className="text-gray-400 mr-1">読み:</span>
                            <span>{parsedData.reading}</span>
                          </div>
                        )}
                        {parsedData.abbreviation && (
                          <div>
                            <span className="text-gray-400 mr-1">略称:</span>
                            <span>{parsedData.abbreviation}</span>
                          </div>
                        )}
                        {parsedData.developer && (
                          <div>
                            <span className="text-gray-400 mr-1">開発元:</span>
                            <span>{parsedData.developer}</span>
                          </div>
                        )}
                        {parsedData.officialUrl && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 mr-1">公式サイト:</span>
                            <span className="break-all">{parsedData.officialUrl}</span>
                          </div>
                        )}
                        {parsedData.categoryOptionIds && parsedData.categoryOptionIds.length > 0 && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 mr-1">分類項目:</span>
                            <div className="inline-flex flex-wrap gap-1 mt-0.5">
                              {parsedData.categoryOptionIds.map((optId) => {
                                const info = optNameMap.get(optId);
                                return (
                                  <span
                                    key={optId}
                                    className="px-2 py-0.5 rounded bg-white dark:bg-zinc-700 border text-[11px]"
                                  >
                                    {info ? `${info.catName}: ${info.optName}` : `ID: ${optId}`}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {parsedData.tags && parsedData.tags.length > 0 && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 mr-1">タグ:</span>
                            <span>{parsedData.tags.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 処理済み履歴セクション */}
      {processedProposals.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            処理済みの提案履歴
          </h3>
          <div className="divide-y divide-gray-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
            {processedProposals.map((prop) => (
              <div key={prop.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mr-2 ${
                      prop.status === "approved"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"
                    }`}
                  >
                    {prop.status === "approved" ? "承認済み" : "却下"}
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200">
                    {prop.game?.name || "新規ゲーム"}
                  </span>
                  <span className="text-gray-400 ml-2">by {prop.submittedBy || "一般"}</span>
                </div>
                <div className="text-gray-400">
                  {prop.reviewedAt ? new Date(prop.reviewedAt).toLocaleDateString("ja-JP") : "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
