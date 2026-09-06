"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitProposal } from "@/lib/actions/proposals";
import { GameFormData } from "@/lib/actions/games";

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

interface ProposalFormProps {
  gameId: number;
  initialData: {
    name: string;
    reading?: string | null;
    abbreviation?: string | null;
    developer?: string | null;
    officialUrl?: string | null;
    notes?: string | null;
    categoryOptionIds: number[];
    attributes?: { attributeId: number; value: string }[];
    tags: string[];
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
}

export default function ProposalForm({
  gameId,
  initialData,
  categories,
  sources,
}: ProposalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // 提案メタ情報
  const [submittedBy, setSubmittedBy] = useState("");
  const [comment, setComment] = useState("");

  // ゲーム基本情報
  const [name, setName] = useState(initialData.name);
  const [reading, setReading] = useState(initialData.reading || "");
  const [abbreviation, setAbbreviation] = useState(initialData.abbreviation || "");
  const [developer, setDeveloper] = useState(initialData.developer || "");
  const [officialUrl, setOfficialUrl] = useState(initialData.officialUrl || "");
  const [notes, setNotes] = useState(initialData.notes || "");

  // 分類選択肢ID
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>(
    initialData.categoryOptionIds
  );

  // タグ
  const [tagsStr, setTagsStr] = useState(initialData.tags.join(", "));

  // フィールドステータスマップ
  const initialStatusMap: Record<
    string,
    { status: string; sourceId?: number | null; lastConfirmedAt?: string | null }
  > = {};
  initialData.fieldStatuses.forEach((st) => {
    initialStatusMap[st.fieldName] = {
      status: st.status,
      sourceId: st.sourceId,
      lastConfirmedAt: st.lastConfirmedAt
        ? new Date(st.lastConfirmedAt).toISOString().split("T")[0]
        : "",
    };
  });
  const [statusMap, setStatusMap] = useState(initialStatusMap);

  const toggleOption = (id: number) => {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("ゲーム名は必須です");
      return;
    }

    const proposedData: GameFormData = {
      name,
      reading,
      abbreviation,
      developer,
      officialUrl,
      notes,
      categoryOptionIds: selectedOptionIds,
      attributes: [], // 詳細属性は不使用
      tags: tagsStr
        .split(/[,、]/)
        .map((t) => t.trim())
        .filter(Boolean),
      fieldStatuses: Object.entries(statusMap)
        .filter(([_, data]) => data.status)
        .map(([fieldName, data]) => ({
          fieldName,
          status: data.status,
          sourceId: data.sourceId ? Number(data.sourceId) : null,
          lastConfirmedAt: data.lastConfirmedAt || null,
        })),
    };

    startTransition(async () => {
      try {
        await submitProposal({
          gameId,
          type: "update",
          proposedData,
          submittedBy,
          comment,
        });
        setSubmitted(true);
      } catch (err: any) {
        setErrorMsg(err.message || "提案の送信に失敗しました");
      }
    });
  };

  if (submitted) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">
          修正提案を送信しました
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ご協力ありがとうございます。管理者が内容を確認次第、情報に反映されます。
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href={`/games/${gameId}`}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition"
          >
            ゲーム詳細に戻る
          </Link>
          <Link
            href="/admin/proposals"
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 text-xs font-medium hover:bg-gray-100 transition"
          >
            提案一覧（管理者画面）を見る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* 提案者情報・コメント */}
      <div className="bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200 border-b border-amber-200/60 pb-3">
          提案者情報・修正理由
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
              あなたのお名前 / ニックネーム（任意）
            </label>
            <input
              type="text"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="例: 音ゲーファンA"
              className="w-full px-3.5 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
              修正の理由・根拠（情報源URLや変更点の説明）
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="例: 公式サイト告知により対応プラットフォームが追加されたため更新しました。"
              className="w-full px-3.5 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 修正後のゲーム情報入力フォーム */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3">
          提案するゲーム基本情報
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
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              備考・特徴説明
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 分類項目 */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3">
          提案する分類項目
        </h2>
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

      {/* タグ */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3">
          タグ
        </h2>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            自由タグ（カンマ区切り）
          </label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 送信ボタン */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href={`/games/${gameId}`}
          className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 text-sm font-medium hover:bg-gray-100 transition"
        >
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition cursor-pointer flex items-center gap-2"
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
          <span>修正提案を送信する</span>
        </button>
      </div>
    </form>
  );
}
