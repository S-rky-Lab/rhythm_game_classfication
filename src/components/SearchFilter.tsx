"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface CategoryWithOpt {
  id: number;
  name: string;
  options: { id: number; name: string }[];
}

interface SearchFilterProps {
  categories: CategoryWithOpt[];
  currentQuery: string;
  selectedOptionIds: number[];
}

export default function SearchFilter({
  categories,
  currentQuery,
  selectedOptionIds,
}: SearchFilterProps) {
  const router = useRouter();

  const [q, setQ] = useState(currentQuery);
  const [optionIds, setOptionIds] = useState<number[]>(selectedOptionIds);
  const [isOpenFilter, setIsOpenFilter] = useState(false);

  const handleOptionToggle = (id: number) => {
    setOptionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) {
      params.set("q", q.trim());
    }
    if (optionIds.length > 0) {
      params.set("options", optionIds.join(","));
    }

    router.push(`/games?${params.toString()}`);
  };

  const handleReset = () => {
    setQ("");
    setOptionIds([]);
    router.push("/games");
  };

  const hasActiveFilters = q.trim() !== "" || optionIds.length > 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm p-4 mb-6">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* キーワード検索バー */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ゲーム名、略称、よみがな、開発元、タグ（例: IIDX, セガ, 鍵盤, 足）..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 transition"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer shadow-sm"
            >
              検索
            </button>
            <button
              type="button"
              onClick={() => setIsOpenFilter(!isOpenFilter)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                isOpenFilter || optionIds.length > 0
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>絞り込み条件</span>
              {optionIds.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-xs">
                  {optionIds.length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
              >
                リセット
              </button>
            )}
          </div>
        </div>

        {/* 条件フィルタ展開パネル */}
        {isOpenFilter && (
          <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-5 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {cat.name}
                  </h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {cat.options.map((opt) => {
                      const checked = optionIds.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-2 text-xs p-1.5 rounded cursor-pointer transition ${
                            checked
                              ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium"
                              : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleOptionToggle(opt.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">{opt.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleSearch()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition cursor-pointer"
              >
                この条件で絞り込む
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
