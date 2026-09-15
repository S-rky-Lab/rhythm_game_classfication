"use client";

import { useState } from "react";
import {
  generateGameNotes,
  NotesGenerationInput,
} from "@/lib/actions/ai";

interface GenerateNotesButtonProps {
  input: NotesGenerationInput;
  onGenerated: (notes: string) => void;
}

/** Renders a control that generates game notes from the current form input. */
export default function GenerateNotesButton({
  input,
  onGenerated,
}: GenerateNotesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResultCount, setSearchResultCount] = useState<number | null>(null);

  /** Requests generated notes and reports the result to the parent form. */
  const handleGenerate = async () => {
    setError(null);
    setSearchResultCount(null);
    setIsGenerating(true);
    try {
      const result = await generateGameNotes(input);
      if (result.error) {
        throw new Error(result.error);
      }
      if (typeof result === "string") {
        onGenerated(result);
        setSearchResultCount(null);
      } else {
        onGenerated(result.notes);
        setSearchResultCount(result.searchResultCount);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || !input.name.trim()}
        className="rounded-lg border border-indigo-300 dark:border-indigo-700 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? "AIが確認中..." : "AIで特徴説明を作成"}
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        情報が十分に確認できない場合は「情報が有りませんでした」と記載します。
      </p>
      {searchResultCount !== null && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          TinyFish検索完了: {searchResultCount}件の検索結果を取得しました。
        </p>
      )}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
