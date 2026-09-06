import React from "react";

export type FieldStatusType =
  | "confirmed"
  | "unconfirmed"
  | "estimated"
  | "unknown_source"
  | "deprecated"
  | string;

interface StatusBadgeProps {
  status: FieldStatusType;
  lastConfirmedAt?: Date | string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}

export const statusLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
  confirmed: {
    label: "確認済み",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  unconfirmed: {
    label: "未確認",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  estimated: {
    label: "推定",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
  },
  unknown_source: {
    label: "情報源不明",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  deprecated: {
    label: "廃止済み",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-300 dark:border-zinc-700",
  },
};

export default function StatusBadge({
  status,
  lastConfirmedAt,
  sourceName,
  sourceUrl,
}: StatusBadgeProps) {
  const meta = statusLabels[status] || {
    label: status,
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
  };

  const formattedDate = lastConfirmedAt
    ? new Date(lastConfirmedAt).toLocaleDateString("ja-JP")
    : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.text} ${meta.border}`}
      title={
        [
          `状態: ${meta.label}`,
          sourceName ? `情報源: ${sourceName}` : null,
          formattedDate ? `最終確認日: ${formattedDate}` : null,
        ]
          .filter(Boolean)
          .join(" | ")
      }
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{meta.label}</span>
      {sourceName && (
        <span className="opacity-75">
          ({sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline hover:opacity-100"
            >
              {sourceName}
            </a>
          ) : (
            sourceName
          )})
        </span>
      )}
      {formattedDate && <span className="opacity-60 text-[10px]">[{formattedDate}]</span>}
    </span>
  );
}
