import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "音ゲー分類DB - 音楽ゲーム横断検索・分類・比較",
  description: "音楽ゲームをジャンル・操作デバイス・レーン方式・判定方式など多角的な属性から検索・分類・比較できるデータベース",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 antialiased">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 dark:border-zinc-800 py-6 text-center text-xs text-gray-500">
          音ゲー分類プロジェクト (MVP)
        </footer>
      </body>
    </html>
  );
}
