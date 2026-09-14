"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  ArchiveDirectoryNode,
  ArchiveGameNode,
} from "@/lib/archive";

function GameLink({ game }: { game: ArchiveGameNode }) {
  return (
    <Link
      href={game.href}
      className="block rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
    >
      {game.name}
    </Link>
  );
}

function Directory({
  directory,
  depth,
}: {
  directory: ArchiveDirectoryNode;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  return (
    <li>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
        aria-expanded={isOpen}
      >
        <span className="w-4 text-xs text-gray-500">{isOpen ? "▼" : "▶"}</span>
        <span className="font-semibold text-gray-900 dark:text-zinc-100">
          {directory.name}
        </span>
        <span className="text-xs text-gray-500 dark:text-zinc-400">
          ({directory.gameCount}件)
        </span>
      </button>
      {isOpen && (
        <div className="ml-4 border-l border-gray-200 pl-3 dark:border-zinc-800">
          <ul className="space-y-2">
            {directory.children.map((child) => (
              <Directory
                key={`${directory.name}/${child.name}`}
                directory={child}
                depth={depth + 1}
              />
            ))}
            {directory.games.map((game) => (
              <li key={game.gameId}>
                <GameLink game={game} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function ArchiveTree({
  archive,
}: {
  archive: ArchiveDirectoryNode;
}) {
  return (
    <ul className="space-y-2">
      {archive.children.map((directory) => (
        <Directory
          key={directory.name}
          directory={directory}
          depth={0}
        />
      ))}
    </ul>
  );
}
