import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  if (isNaN(id)) {
    notFound();
  }

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          categoryOption: {
            include: {
              category: true,
            },
          },
        },
      },
      attributes: {
        include: {
          attribute: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      fieldStatuses: {
        include: {
          source: true,
        },
      },
      relationsFrom: {
        include: {
          relatedGame: true,
        },
      },
      relationsTo: {
        include: {
          game: true,
        },
      },
      histories: {
        orderBy: { changedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!game) {
    notFound();
  }

  // カテゴリごとにグループ化
  const categoryGroups: Record<
    string,
    { categoryName: string; options: { id: number; name: string }[] }
  > = {};

  game.categories.forEach((gc) => {
    const catName = gc.categoryOption.category.name;
    if (!categoryGroups[catName]) {
      categoryGroups[catName] = { categoryName: catName, options: [] };
    }
    categoryGroups[catName].options.push({
      id: gc.categoryOption.id,
      name: gc.categoryOption.name,
    });
  });

  // フィールドごとのステータスマップ
  const statusMap = new Map<string, (typeof game.fieldStatuses)[0]>();
  game.fieldStatuses.forEach((st) => {
    statusMap.set(st.fieldName, st);
  });

  const getStatus = (fieldName: string) => statusMap.get(fieldName);

  // --- 類似音ゲーの算出 (分類・タグの共通点を探す) ---
  const currentOptionIds = new Set(game.categories.map((c) => c.categoryOptionId));
  const currentTagIds = new Set(game.tags.map((t) => t.tagId));

  const otherGames = await prisma.game.findMany({
    where: { id: { not: game.id } },
    include: {
      categories: {
        include: {
          categoryOption: {
            include: {
              category: true,
            },
          },
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      attributes: {
        include: {
          attribute: true,
        },
      },
    },
  });

  interface SimilarGameInfo {
    game: (typeof otherGames)[0];
    score: number;
    commonCategories: string[];
    commonTags: string[];
  }

  const similarGames: SimilarGameInfo[] = [];

  for (const other of otherGames) {
    const commonCategories: string[] = [];
    const commonTags: string[] = [];

    // 共通の分類項目
    other.categories.forEach((oc) => {
      if (currentOptionIds.has(oc.categoryOptionId)) {
        commonCategories.push(
          `${oc.categoryOption.category.name}: ${oc.categoryOption.name}`
        );
      }
    });

    // 共通のタグ
    other.tags.forEach((ot) => {
      if (currentTagIds.has(ot.tagId)) {
        commonTags.push(ot.tag.name);
      }
    });

    const score = commonCategories.length * 2 + commonTags.length;

    if (score > 0) {
      similarGames.push({
        game: other,
        score,
        commonCategories,
        commonTags,
      });
    }
  }

  // スコア降順ソート (上位5件)
  similarGames.sort((a, b) => b.score - a.score);
  const topSimilarGames = similarGames.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* ナビゲーションパンくず */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/games" className="hover:text-indigo-600 transition">
          ゲーム一覧
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-zinc-100 font-medium">
          {game.name}
        </span>
      </div>

      {/* ヘッダーブロック */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            {game.reading && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {game.reading}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-zinc-50">
                {game.name}
              </h1>
              {game.abbreviation && (
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-100 dark:border-indigo-900">
                  {game.abbreviation}
                </span>
              )}
            </div>
            {game.developer && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                開発・運営: <span className="font-medium text-gray-800 dark:text-gray-200">{game.developer}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/compare?ids=${game.id}`}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>他タイトルと比較</span>
            </Link>
            <Link
              href={`/games/${game.id}/propose`}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>修正提案</span>
            </Link>
            <Link
              href={`/games/${game.id}/edit`}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            >
              編集
            </Link>
          </div>
        </div>

        {/* 公式URL */}
        {game.officialUrl && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-3 text-xs flex-wrap">
            <span className="text-gray-400">公式サイト:</span>
            <a
              href={game.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium break-all flex items-center gap-1"
            >
              <span>{game.officialUrl}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            {getStatus("official_url") && (
              <StatusBadge
                status={getStatus("official_url")!.status}
                lastConfirmedAt={getStatus("official_url")!.lastConfirmedAt}
                sourceName={getStatus("official_url")!.source?.name}
                sourceUrl={getStatus("official_url")!.source?.url}
              />
            )}
          </div>
        )}

        {/* 備考・概要 */}
        {game.notes && (
          <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/60 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {game.notes}
          </div>
        )}

        {/* タグ */}
        {game.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {game.tags.map((gt) => (
              <Link
                key={gt.tag.id}
                href={`/games?q=${encodeURIComponent(gt.tag.name)}`}
                className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition"
              >
                #{gt.tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* --- 類似のシステムを持つ音ゲー（類似音ゲー探索＆比較）セクション --- */}
      <div className="bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-purple-950/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <span>類似システムを持つ音ゲーを探す</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                おすすめ比較
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              操作デバイス・レーン方式・プレイスタイル等の分類やタグが共通するタイトル
            </p>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            ワンクリックで2画面差分比較が可能
          </span>
        </div>

        {topSimilarGames.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">
            共通の分類やタグを持つ類似音ゲーはまだ登録されていません。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {topSimilarGames.map(({ game: sim, commonCategories, commonTags }) => (
              <div
                key={sim.id}
                className="p-4 rounded-xl border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-400 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/games/${sim.id}`}
                      className="font-bold text-sm text-gray-900 dark:text-zinc-100 hover:text-indigo-600 transition"
                    >
                      {sim.name}
                    </Link>
                    {sim.abbreviation && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                        {sim.abbreviation}
                      </span>
                    )}
                    {sim.developer && (
                      <span className="text-xs text-gray-400">· {sim.developer}</span>
                    )}
                  </div>

                  {/* 共通点のバッジ表示 */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">
                      共通点:
                    </span>
                    {commonCategories.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 text-[11px] font-medium"
                      >
                        {c}
                      </span>
                    ))}
                    {commonTags.map((t, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[10px]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 比較アクションボタン */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link
                    href={`/compare?ids=${game.id},${sim.id}`}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                    title={`「${game.name}」と「${sim.name}」を横並びで比較`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>このゲームと比較する</span>
                  </Link>
                  <Link
                    href={`/games/${sim.id}`}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition"
                  >
                    詳細 &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分類項目（マスタ管理） */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
          <span>分類項目</span>
          <span className="text-xs font-normal text-gray-400">(ゲームシステム・操作等)</span>
        </h2>

        {Object.keys(categoryGroups).length === 0 ? (
          <p className="text-xs text-gray-400">登録された分類項目はありません。</p>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(categoryGroups).map((grp) => (
              <div
                key={grp.categoryName}
                className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40"
              >
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {grp.categoryName}
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {grp.options.map((opt) => (
                    <Link
                      key={opt.id}
                      href={`/games?options=${opt.id}`}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 hover:bg-indigo-100 transition"
                      title={`「${opt.name}」でゲームを検索`}
                    >
                      {opt.name} 🔍
                    </Link>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>


      {/* 情報源・情報ステータス一覧 */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
          <span>情報源・確認ステータス記録</span>
          <span className="text-xs font-normal text-gray-400">
            (確認済み／未確認／推定／情報源不明／廃止済み)
          </span>
        </h2>

        {game.fieldStatuses.length === 0 ? (
          <p className="text-xs text-gray-400">個別のステータス記録はありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">対象項目</th>
                  <th className="py-2.5 px-3">状態</th>
                  <th className="py-2.5 px-3">情報源</th>
                  <th className="py-2.5 px-3">最終確認日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {game.fieldStatuses.map((fs) => (
                  <tr key={fs.id}>
                    <td className="py-2.5 px-3 font-semibold text-gray-800 dark:text-zinc-200">
                      {fs.fieldName}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={fs.status} />
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                      {fs.source ? (
                        fs.source.url ? (
                          <a
                            href={fs.source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-indigo-600 hover:text-indigo-500"
                          >
                            {fs.source.name} ({fs.source.type})
                          </a>
                        ) : (
                          `${fs.source.name} (${fs.source.type})`
                        )
                      ) : (
                        "未指定"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {fs.lastConfirmedAt
                        ? new Date(fs.lastConfirmedAt).toLocaleDateString("ja-JP")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 関連ゲーム（シリーズ・派生・移植） */}
      {(game.relationsFrom.length > 0 || game.relationsTo.length > 0) && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 border-b border-gray-100 dark:border-zinc-800 pb-3">
            関連ゲーム（シリーズ・派生）
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {game.relationsFrom.map((rel) => (
              <Link
                key={rel.id}
                href={`/games/${rel.relatedGame.id}`}
                className="p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-indigo-500 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {rel.relationType}
                  </div>
                  <div className="font-bold text-sm text-gray-900 dark:text-zinc-100">
                    {rel.relatedGame.name}
                  </div>
                </div>
                <span className="text-gray-400">&rarr;</span>
              </Link>
            ))}
            {game.relationsTo.map((rel) => (
              <Link
                key={rel.id}
                href={`/games/${rel.game.id}`}
                className="p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-indigo-500 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {rel.relationType} (被リンク)
                  </div>
                  <div className="font-bold text-sm text-gray-900 dark:text-zinc-100">
                    {rel.game.name}
                  </div>
                </div>
                <span className="text-gray-400">&rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 更新履歴 */}
      {game.histories.length > 0 && (
        <div className="text-xs text-gray-400 space-y-1">
          <h4 className="font-semibold uppercase tracking-wider">最近の変更履歴</h4>
          <ul className="space-y-0.5">
            {game.histories.map((h) => (
              <li key={h.id}>
                {new Date(h.changedAt).toLocaleString("ja-JP")}: [{h.changedField}] by {h.changedBy || "system"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
