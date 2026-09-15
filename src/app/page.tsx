import Link from "next/link";

const destinations = [
  {
    href: "/games",
    title: "ゲームを検索する",
    description:
      "ゲーム名や開発元、プレイスタイル、操作方式、プラットフォームなどの条件から探します。",
    action: "検索一覧を見る",
    icon: "⌕",
  },
  {
    href: "/archive",
    title: "アーカイブを閲覧する",
    description:
      "プラットフォームと操作方式のディレクトリを辿りながら、ゲームを探します。",
    action: "アーカイブを見る",
    icon: "▤",
  },
];

/** Renders the home page with links to the primary browsing experiences. */
export default function Home() {
  return (
    <div className="space-y-10">
      <section className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-sm font-semibold tracking-widest text-indigo-600 dark:text-indigo-400">
          RHYTHM GAME DATABASE
        </p>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-zinc-50 sm:text-4xl">
          音ゲー分類プロジェクト
        </h1>
        <p className="text-sm leading-7 text-gray-600 dark:text-zinc-400 sm:text-base">
          音楽ゲームを分類・検索・比較できるデータベースです。
          探し方に合わせて、検索一覧またはアーカイブを選択してください。
        </p>
      </section>

      <section className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        {destinations.map((destination) => (
          <Link
            key={destination.href}
            href={destination.href}
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                {destination.icon}
              </span>
              <span className="text-xl text-gray-400 transition group-hover:translate-x-1 group-hover:text-indigo-500">
                →
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">
              {destination.title}
            </h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-gray-600 dark:text-zinc-400">
              {destination.description}
            </p>
            <p className="mt-5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {destination.action} →
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
