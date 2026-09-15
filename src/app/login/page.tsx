import Link from "next/link";
import { login } from "@/lib/actions/auth";

interface PageProps {
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const redirectTo =
    resolvedSearchParams.redirectTo?.startsWith("/") &&
    !resolvedSearchParams.redirectTo.startsWith("//")
      ? resolvedSearchParams.redirectTo
      : "/games";

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/games" className="hover:text-indigo-600 transition">
          ゲーム一覧
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-zinc-100 font-medium">ログイン</span>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-black text-gray-900 dark:text-zinc-50">
            管理者ログイン
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            登録・編集・提案承認を行うにはログインしてください。
          </p>
        </div>

        {resolvedSearchParams.error && (
          <div className="mb-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            ログインに失敗しました。
          </div>
        )}

        <form action={login} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              管理者パスワード
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
