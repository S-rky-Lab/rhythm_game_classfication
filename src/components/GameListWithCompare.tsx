"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

export interface GameItem {
  id: number;
  name: string;
  reading: string | null;
  abbreviation: string | null;
  developer: string | null;
  officialUrl: string | null;
  notes: string | null;
  categories: {
    categoryOption: {
      id: number;
      name: string;
      category: {
        id: number;
        name: string;
      };
    };
  }[];
  attributes: {
    attribute: {
      id: number;
      name: string;
    };
    value: string;
  }[];
  tags: {
    tag: {
      id: number;
      name: string;
    };
  }[];
  fieldStatuses: {
    fieldName: string;
    status: string;
    lastConfirmedAt: Date | null;
    source: {
      name: string;
      url: string | null;
    } | null;
  }[];
}

interface GameListWithCompareProps {
  games: GameItem[];
}

export default function GameListWithCompare({ games }: GameListWithCompareProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "list">("table");

  const toggleSelect = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  // ゲームの行クリックで詳細ページへ
  const handleRowClick = (id: number) => {
    router.push(`/games/${id}`);
  };

  // 分類カテゴリごとに値を取り出すヘルパー
  const getCategoryOptions = (game: GameItem, catName: string) => {
    return game.categories
      .filter((gc) => gc.categoryOption.category.name === catName)
      .map((gc) => gc.categoryOption.name);
  };

  // 属性値を取り出すヘルパー
  const getAttributeValue = (game: GameItem, attrName: string) => {
    return game.attributes.find((ga) => ga.attribute.name === attrName)?.value;
  };

  return (
    <div className="space-y-3 relative pb-24">
      {/* ツールバー: 件数と表示形式切替 */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            該当件数: {games.length} 件
          </span>
          <span className="hidden sm:inline text-gray-400">
            （タイトルまたは行をクリックで詳細ページへ遷移）
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-lg border border-gray-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === "table"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>表形式（コンパクト）</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === "list"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>カード/リスト</span>
          </button>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
          <p className="text-gray-500 text-sm">該当するゲームが見つかりませんでした。</p>
          <p className="text-xs text-gray-400 mt-1">検索条件を変更するかリセットしてください。</p>
        </div>
      ) : viewMode === "table" ? (
        /* --- 1. 高密度・コンパクト表形式 (テーブル) --- */
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-zinc-800/60 border-b border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400 font-semibold uppercase">
                <th className="py-2.5 px-3 w-10 text-center">比較</th>
                <th className="py-2.5 px-3 min-w-44">ゲームタイトル / 略称</th>
                <th className="py-2.5 px-3 min-w-28">開発・運営</th>
                <th className="py-2.5 px-3 min-w-28">プレイスタイル</th>
                <th className="py-2.5 px-3 min-w-36">操作方式</th>
                <th className="py-2.5 px-3 min-w-36">レーン・ノーツ方式</th>
                <th className="py-2.5 px-3 min-w-32">プラットフォーム</th>
                <th className="py-2.5 px-3 min-w-28">タグ</th>
                <th className="py-2.5 px-3 text-right pr-4">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {games.map((game) => {
                const isSelected = selectedIds.includes(game.id);
                const playStyles = getCategoryOptions(game, "プレイスタイル");
                const operations = getCategoryOptions(game, "操作方式");
                const lanes = getCategoryOptions(game, "レーン・ノーツ方式");
                const platforms = getCategoryOptions(game, "プラットフォーム");
                const platformText =
                  platforms.length > 0
                    ? platforms.join(", ")
                    : getAttributeValue(game, "プラットフォーム");

                return (
                  <tr
                    key={game.id}
                    onClick={() => handleRowClick(game.id)}
                    className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition ${
                      isSelected ? "bg-indigo-50/60 dark:bg-indigo-950/30" : ""
                    }`}
                  >
                    {/* 比較チェック */}
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(game.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        title="比較対象に選択"
                      />
                    </td>

                    {/* ゲーム名 */}
                    <td className="py-2.5 px-3">
                      <div>
                        {game.reading && (
                          <div className="text-[10px] text-gray-400 leading-tight">
                            {game.reading}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/games/${game.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-gray-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs sm:text-sm"
                          >
                            {game.name}
                          </Link>
                          {game.abbreviation && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                              {game.abbreviation}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 開発・運営 */}
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                      {game.developer || "-"}
                    </td>

                    {/* プレイスタイル */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {playStyles.length > 0 ? (
                          playStyles.map((ps) => (
                            <span
                              key={ps}
                              className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900 text-[11px]"
                            >
                              {ps}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* 操作方式 */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {operations.length > 0 ? (
                          operations.map((op) => (
                            <span
                              key={op}
                              className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 text-[11px]"
                            >
                              {op}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* レーン・ノーツ方式 */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {lanes.length > 0 ? (
                          lanes.map((l) => (
                            <span
                              key={l}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900 text-[11px]"
                            >
                              {l}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* プラットフォーム */}
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                      <span className="truncate max-w-xs block" title={platformText || ""}>
                        {platformText || "-"}
                      </span>
                    </td>

                    {/* タグ */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {game.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.tag.id}
                            className="text-[10px] px-1 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500"
                          >
                            #{t.tag.name}
                          </span>
                        ))}
                        {game.tags.length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{game.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 操作 */}
                    <td
                      className="py-2.5 px-3 text-right pr-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/games/${game.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-medium text-[11px] transition"
                      >
                        <span>専用ページ</span>
                        <span>&rarr;</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* --- 2. リスト形式（コンパクトカード） --- */
        <div className="divide-y divide-gray-100 dark:divide-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          {games.map((game) => {
            const isSelected = selectedIds.includes(game.id);

            return (
              <div
                key={game.id}
                onClick={() => handleRowClick(game.id)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800/40 cursor-pointer transition ${
                  isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/30" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(game.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    {game.reading && (
                      <div className="text-[10px] text-gray-400 leading-tight">
                        {game.reading}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/games/${game.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-base font-bold text-gray-900 dark:text-zinc-100 hover:text-indigo-600 transition"
                      >
                        {game.name}
                      </Link>
                      {game.abbreviation && (
                        <span className="text-xs px-2 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                          {game.abbreviation}
                        </span>
                      )}
                      {game.developer && (
                        <span className="text-xs text-gray-400">
                          · {game.developer}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {game.categories.map((gc) => (
                        <span
                          key={gc.categoryOption.id}
                          className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                        >
                          <span className="opacity-60 mr-1">
                            {gc.categoryOption.category.name}:
                          </span>
                          {gc.categoryOption.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 self-end sm:self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    href={`/games/${game.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition flex items-center gap-1"
                  >
                    <span>専用ページへ</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 比較選択フローティングバー */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 max-w-lg mx-auto px-4 z-30 animate-in slide-in-from-bottom duration-300">
          <div className="bg-zinc-900 text-white dark:bg-zinc-800 rounded-2xl shadow-xl p-3.5 flex items-center justify-between border border-zinc-700">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {selectedIds.length}
              </span>
              <span className="text-sm font-medium">件を選択中</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
              >
                解除
              </button>
            </div>

            <Link
              href={`/compare?ids=${selectedIds.join(",")}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5 ${
                selectedIds.length >= 2
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 cursor-pointer"
              }`}
            >
              <span>{selectedIds.length >= 2 ? "比較画面へ進む" : "2件以上選択して比較"}</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
