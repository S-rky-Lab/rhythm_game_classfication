export const ARCHIVE_UNCLASSIFIED = "未分類";
export const ARCHIVE_PLATFORM_CATEGORY = "プラットフォーム";
export const ARCHIVE_OPERATION_CATEGORY = "操作方式";

export interface ArchiveGameInput {
  id: number;
  name: string;
  categories: Array<{
    categoryOption: {
      name: string;
      category: {
        name: string;
      };
    };
  }>;
}

export interface ArchiveGameNode {
  kind: "game";
  name: string;
  gameId: number;
  href: string;
}

export interface ArchiveDirectoryNode {
  kind: "directory";
  name: string;
  children: ArchiveDirectoryNode[];
  games: ArchiveGameNode[];
  gameCount: number;
}

/** Returns unique strings sorted using Japanese collation. */
function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ja"));
}

/** Converts a game record into an archive game node. */
function createGameNode(game: ArchiveGameInput): ArchiveGameNode {
  return {
    kind: "game",
    name: game.name,
    gameId: game.id,
    href: `/games/${game.id}`,
  };
}

/** Creates an empty archive directory node. */
function createDirectory(name: string): ArchiveDirectoryNode {
  return {
    kind: "directory",
    name,
    children: [],
    games: [],
    gameCount: 0,
  };
}

/** Finds a child directory by name or creates it when absent. */
function getOrCreateDirectory(
  parent: ArchiveDirectoryNode,
  name: string
): ArchiveDirectoryNode {
  const existing = parent.children.find((child) => child.name === name);
  if (existing) return existing;

  const directory = createDirectory(name);
  parent.children.push(directory);
  return directory;
}

/** Adds a game to a directory unless it is already present. */
function addGame(directory: ArchiveDirectoryNode, game: ArchiveGameInput) {
  if (!directory.games.some((item) => item.gameId === game.id)) {
    directory.games.push(createGameNode(game));
  }
}

/** Collects the distinct game identifiers contained below a directory. */
function collectGameIds(directory: ArchiveDirectoryNode): Set<number> {
  const gameIds = new Set(directory.games.map((game) => game.gameId));
  for (const child of directory.children) {
    for (const gameId of collectGameIds(child)) {
      gameIds.add(gameId);
    }
  }
  return gameIds;
}

/** Updates a directory with its recursive distinct game count. */
function updateGameCounts(directory: ArchiveDirectoryNode) {
  directory.gameCount = collectGameIds(directory).size;
}

/** Builds the platform and operation archive hierarchy for a game collection. */
export function buildArchiveTree(
  games: readonly ArchiveGameInput[]
): ArchiveDirectoryNode {
  const root = createDirectory("音ゲーアーカイブ");

  for (const game of games) {
    const groupedCategories = new Map<string, string[]>();
    for (const relation of game.categories) {
      const categoryName = relation.categoryOption.category.name;
      const optionName = relation.categoryOption.name.trim();
      if (!optionName) continue;

      const options = groupedCategories.get(categoryName) ?? [];
      options.push(optionName);
      groupedCategories.set(categoryName, options);
    }

    const platforms = uniqueSorted(
      groupedCategories.get(ARCHIVE_PLATFORM_CATEGORY) ?? [ARCHIVE_UNCLASSIFIED]
    );
    const operations = uniqueSorted(
      groupedCategories.get(ARCHIVE_OPERATION_CATEGORY) ?? [ARCHIVE_UNCLASSIFIED]
    );

    for (const platform of platforms) {
      const platformDirectory = getOrCreateDirectory(root, platform);
      for (const operation of operations) {
        const operationDirectory = getOrCreateDirectory(
          platformDirectory,
          operation
        );
        addGame(operationDirectory, game);
      }
    }
  }

  for (const platformDirectory of root.children) {
    for (const operationDirectory of platformDirectory.children) {
      operationDirectory.games.sort((a, b) =>
        a.name.localeCompare(b.name, "ja")
      );
      updateGameCounts(operationDirectory);
    }
    platformDirectory.children.sort((a, b) =>
      a.name.localeCompare(b.name, "ja")
    );
    updateGameCounts(platformDirectory);
  }
  root.children.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  updateGameCounts(root);

  return root;
}
