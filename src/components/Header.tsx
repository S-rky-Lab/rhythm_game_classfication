import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/games" className="flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-90">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <span>音ゲー分類DB</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Link
              href="/games"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              ゲーム一覧・検索
            </Link>
            <Link
              href="/compare"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              ゲーム比較
            </Link>
            <Link
              href="/admin/proposals"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1.5"
            >
              <span>提案承認</span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded">
                管理
              </span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/games/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>ゲーム登録</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
