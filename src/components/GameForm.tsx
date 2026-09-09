"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { createGame, updateGame, GameFormData } from "@/lib/actions/games";

interface CategoryOption {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  options: CategoryOption[];
}

interface Attribute {
  id: number;
  name: string;
}

interface Source {
  id: number;
  name: string;
  type: string;
}

interface GameFormProps {
  initialData?: {
    id?: number;
    name: string;
    reading?: string | null;
    abbreviation?: string | null;
    developer?: string | null;
    officialUrl?: string | null;
    notes?: string | null;
    categoryOptionIds: number[];
    attributes?: { attributeId: number; value: string }[];
    fieldStatuses: {
      fieldName: string;
      status: string;
      sourceId?: number | null;
      lastConfirmedAt?: string | null;
    }[];
  };
  categories: Category[];
  attributes?: Attribute[];
  sources: Source[];
  mode: "create" | "edit";
}

const statusOptions = [
  { value: "confirmed", label: "確認済み" },
  { value: "unconfirmed", label: "未確認" },
  { value: "estimated", label: "推定" },
  { value: "unknown_source", label: "情報源不明" },
  { value: "deprecated", label: "廃止済み" },
];

export default function GameForm({
  initialData,
  categories,
  sources,
  mode,
}: GameFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 基本情報
  const [name, setName] = useState(initialData?.name || "");
  const [reading, setReading] = useState(initialData?.reading || "");
  const [abbreviation, setAbbreviation] = useState(initialData?.abbreviation || "");
  const [developer, setDeveloper] = useState(initialData?.developer || "");
  const [officialUrl, setOfficialUrl] = useState(initialData?.officialUrl || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  // 分類選択肢ID
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>(
    initialData?.categoryOptionIds || []
  );

  // フィールドステータスマップ (fieldName -> { status, sourceId, lastConfirmedAt })
  const initialStatusMap: Record<
    string,
    { status: string; sourceId?: number | null; lastConfirmedAt?: string | null }
  > = {};
  initialData?.fieldStatuses.forEach((st) => {
    initialStatusMap[st.fieldName] = {
      status: st.status,
      sourceId: st.sourceId,
      lastConfirmedAt: st.lastConfirmedAt
        ? new Date(st.lastConfirmedAt).toISOString().split("T")[0]
        : "",
    };
  });
  const [statusMap, setStatusMap] = useState<
    Record<
      string,
      { status: string; sourceId?: number | null; lastConfirmedAt?: string | null }
    >
  >(initialStatusMap);

  const toggleOption = (id: number) => {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStatusChange = (
    fieldName: string,
    key: "status" | "sourceId" | "lastConfirmedAt",
    val: string | number | null
  ) => {
    setStatusMap((prev) => ({
      ...prev,
      [fieldName]: {
        ...(prev[fieldName] || { status: "confirmed" }),
        [key]: val,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("ゲーム名は必須です");
      return;
    }

    const payload: GameFormData = {
      name,
      reading,
      abbreviation,
      developer,
      officialUrl,
      notes,
      categoryOptionIds: selectedOptionIds,
      attributes: [], // 詳細属性は現在使用しない
      fieldStatuses: Object.entries(statusMap)
        .filter(([, data]) => data.status)
        .map(([fieldName, data]) => ({
          fieldName,
          status: data.status,
          sourceId: data.sourceId ? Number(data.sourceId) : null,
          lastConfirmedAt: data.lastConfirmedAt || null,
        })),
    };

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createGame(payload);
        } else if (mode === "edit" && initialData?.id) {
          await updateGame(initialData.id, payload);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "保存に失敗しました";
        if (message && !message.includes("NEXT_REDIRECT")) {
          setErrorMsg(message);
        }
      }
    });
  };

  // ステータス入力用サブコンポーネント
  const renderStatusInputs = (fieldName: string, labelText: string) => {
    const current = statusMap[fieldName] || {
      status: "",
      sourceId: null,
      lastConfirmedAt: "",
    };
    return (
      <div className="mt-1 p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/60 dark:border-zinc-700/60 text-xs flex flex-wrap items-center gap-3">
        <span className="text-gray-500 font-medium">{labelText}の確度・情報源:</span>
        <select
          value={current.status || ""}
          onChange={(e) => handleStatusChange(fieldName, "status", e.target.value)}
          className="rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1"
        >
          <option value="">-- 状態未設定 --</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={current.sourceId || ""}
          onChange={(e) => handleStatusChange(fieldName, "sourceId", e.target.value || null)}
          className="rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1"
        >
          <option value="">-- 情報源を選択 --</option>
          {sources.map((src) => (
            <option key={src.id} value={src.id}>
              {src.name} ({src.type})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 text-gray-500">
          <span>確認日:</span>
          <input
            type="date"
            value={current.lastConfirmedAt || ""}
            onChange={(e) => handleStatusChange(fieldName, "lastConfirmedAt", e.target.value)}
            className="rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1.5 py-0.5"
          />
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* 1. 基本情報 */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3">
          1. 基本情報
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              ゲーム名 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: beatmania IIDX"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              よみがな
            </label>
            <input
              type="text"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              placeholder="例: ビートマニア ツーディーエックス"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              略称・通称
            </label>
            <input
              type="text"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              placeholder="例: IIDX / 弐寺"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              開発・運営元
            </label>
            <input
              type="text"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              placeholder="例: KONAMI / SEGA"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              公式サイトURL
            </label>
            <input
              type="url"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {officialUrl && (
            <div className="sm:col-span-2">
              {renderStatusInputs("official_url", "公式サイトURL")}
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              備考・特徴説明
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ゲームの特徴やシステム概要などを入力"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 2. 分類項目 (複数選択可) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="border-b border-gray-100 dark:border-zinc-800 pb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
            2. 分類項目 (マスタ選択肢)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            プレイスタイル、操作方式、レーン・ノーツ方式、プレイ形態、プラットフォームを選択してください（複数選択可）
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 space-y-2.5"
            >
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {cat.name}
              </h3>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {cat.options.map((opt) => {
                  const checked = selectedOptionIds.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2 text-sm p-1.5 rounded cursor-pointer transition ${
                        checked
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
                          : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOption(opt.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>{opt.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 送信ボタン */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href={initialData?.id ? `/games/${initialData.id}` : "/games"}
          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition cursor-pointer flex items-center gap-2"
        >
          {isPending && (
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          )}
          <span>{mode === "create" ? "ゲームを登録する" : "変更を保存する"}</span>
        </button>
      </div>
    </form>
  );
}
