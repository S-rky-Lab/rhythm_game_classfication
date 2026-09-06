"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GameDetail {
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
}

interface MasterCategory {
  id: number;
  name: string;
}

interface MasterAttribute {
  id: number;
  name: string;
}

interface CompareTableProps {
  games: GameDetail[];
  allGames: { id: number; name: string }[];
  allCategories: MasterCategory[];
  allAttributes?: MasterAttribute[];
}

export default function CompareTable({
  games,
  allGames,
  allCategories,
  allAttributes,
}: CompareTableProps) {
  const router = useRouter();
  const [selectedAddId, setSelectedAddId] = useState<string>("");

  const currentIds = games.map((g) => g.id);

  const handleRemove = (idToRemove: number) => {
    const nextIds = currentIds.filter((id) => id !== idToRemove);
    if (nextIds.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?ids=${nextIds.join(",")}`);
    }
  };

  const handleAdd = () => {
    if (!selectedAddId) return;
    const nextId = parseInt(selectedAddId, 10);
    if (!currentIds.includes(nextId)) {
      const nextIds = [...currentIds, nextId];
      router.push(`/compare?ids=${nextIds.join(",")}`);
    }
    setSelectedAddId("");
  };

  // 分類項目のマッピング: gameId -> (categoryName -> options[])
  const gameCatMap = new Map<number, Map<string, string[]>>();
  games.forEach((game) => {
    const catMap = new Map<string, string[]>();
    game.categories.forEach((gc) => {
      const cName = gc.categoryOption.category.name;
      if (!catMap.has(cName)) {
        catMap.set(cName, []);
      }
      catMap.get(cName)!.push(gc.categoryOption.name);
    });
    gameCatMap.set(game.id, catMap);
  });

  // 属性のマッピング: gameId -> (attributeName -> value)
  const gameAttrMap = new Map<number, Map<string, string>>();
  games.forEach((game) => {
    const attrMap = new Map<string, string>();
    game.attributes.forEach((ga) => {
      attrMap.set(ga.attribute.name, ga.value);
    });
    gameAttrMap.set(game.id, attrMap);
  });

  return (
    <div className="space-y-6">
      {/* 操作バー: 追加セレクタ & タイトル */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          比較対象: <span className="text-indigo-600 font-bold">{games.length}</span> タイトル
          {games.length < 2 && (
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
              ※2件以上選択すると差分を比較できます
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedAddId}
            onChange={(e) => setSelectedAddId(e.target.value)}
            className="flex-1 sm:w-64 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
          >
            <option value="">-- 比較にタイトルを追加 --</option>
            {allGames
              .filter((ag) => !currentIds.includes(ag.id))
              .map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedAddId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            追加
          </button>
        </div>
      </div>

      {/* 比較テーブル */}
      {games.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
          <p className="text-gray-500 text-sm">比較するゲームが選択されていません。</p>
          <p className="text-xs text-gray-400 mt-1">
            上のドロップダウン、または<Link href="/games" className="text-indigo-600 underline ml-1">ゲーム一覧</Link>から比較したいタイトルを選択してください。
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/50">
                <th className="p-4 w-44 min-w-36 font-bold text-gray-500 uppercase tracking-wider text-xs sticky left-0 bg-gray-50 dark:bg-zinc-800 z-10">
                  比較項目
                </th>
                {games.map((game) => (
                  <th
                    key={game.id}
                    className="p-4 min-w-64 max-w-xs align-top border-l border-gray-200 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {game.reading && (
                          <div className="text-[10px] text-gray-400 font-normal">
                            {game.reading}
                          </div>
                        )}
                        <Link
                          href={`/games/${game.id}`}
                          className="font-bold text-base text-gray-900 dark:text-zinc-100 hover:text-indigo-600 transition"
                        >
                          {game.name}
                        </Link>
                        {game.abbreviation && (
                          <span className="ml-1 text-xs text-gray-400 font-normal">
                            ({game.abbreviation})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(game.id)}
                        className="text-gray-400 hover:text-rose-500 p-1 transition"
                        title="比較から外す"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {/* 基本情報行 */}
              <tr>
                <td className="p-4 font-semibold text-gray-500 bg-gray-50/40 dark:bg-zinc-800/30 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                  開発・運営
                </td>
                {games.map((g) => (
                  <td key={g.id} className="p-4 border-l border-gray-200 dark:border-zinc-800">
                    {g.developer || "-"}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-4 font-semibold text-gray-500 bg-gray-50/40 dark:bg-zinc-800/30 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                  公式サイト
                </td>
                {games.map((g) => (
                  <td key={g.id} className="p-4 border-l border-gray-200 dark:border-zinc-800 text-xs">
                    {g.officialUrl ? (
                      <a
                        href={g.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline break-all"
                      >
                        公式サイトを開く &rarr;
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                ))}
              </tr>

              {/* 分類項目セクションヘッダー */}
              <tr className="bg-indigo-50/60 dark:bg-indigo-950/30 font-bold text-xs text-indigo-900 dark:text-indigo-300">
                <td colSpan={games.length + 1} className="py-2 px-4">
                  ■ 分類項目 (システム・操作方式)
                </td>
              </tr>

              {allCategories.map((cat) => {
                // 比較対象間で値が全て一致しているか確認（差分ハイライト用）
                const values = games.map(
                  (g) => gameCatMap.get(g.id)?.get(cat.name)?.join(", ") || ""
                );
                const isDifferent =
                  games.length > 1 && new Set(values).size > 1;

                return (
                  <tr
                    key={cat.id}
                    className={isDifferent ? "bg-amber-50/20 dark:bg-amber-950/10" : ""}
                  >
                    <td className="p-4 font-semibold text-gray-700 dark:text-gray-300 bg-gray-50/40 dark:bg-zinc-800/30 sticky left-0 bg-white dark:bg-zinc-900 z-10 flex items-center justify-between">
                      <span>{cat.name}</span>
                      {isDifferent && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded">
                          相違
                        </span>
                      )}
                    </td>
                    {games.map((g) => {
                      const opts = gameCatMap.get(g.id)?.get(cat.name) || [];
                      return (
                        <td
                          key={g.id}
                          className="p-4 border-l border-gray-200 dark:border-zinc-800"
                        >
                          {opts.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {opts.map((opt) => (
                                <span
                                  key={opt}
                                  className="px-2 py-0.5 rounded text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}


              {/* タグ行 */}
              <tr>
                <td className="p-4 font-semibold text-gray-500 bg-gray-50/40 dark:bg-zinc-800/30 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                  タグ
                </td>
                {games.map((g) => (
                  <td key={g.id} className="p-4 border-l border-gray-200 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-1">
                      {g.tags.map((t) => (
                        <span
                          key={t.tag.id}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"
                        >
                          #{t.tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* 備考行 */}
              <tr>
                <td className="p-4 font-semibold text-gray-500 bg-gray-50/40 dark:bg-zinc-800/30 sticky left-0 bg-white dark:bg-zinc-900 z-10">
                  特徴・備考
                </td>
                {games.map((g) => (
                  <td
                    key={g.id}
                    className="p-4 border-l border-gray-200 dark:border-zinc-800 text-xs text-gray-600 dark:text-gray-400 leading-relaxed"
                  >
                    {g.notes || "-"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
