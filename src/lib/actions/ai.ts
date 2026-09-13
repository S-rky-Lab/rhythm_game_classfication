"use server";

import { GoogleGenAI } from "@google/genai";
import { NOTE_REFERENCE_GAMES } from "@/lib/ai/sample-games";

const NO_INFORMATION = "情報が有りませんでした";

export interface NotesGenerationInput {
  name: string;
  reading?: string;
  abbreviation?: string;
  developer?: string;
  officialUrl?: string;
  categories: string[];
  fieldStatuses: string[];
}

export interface NotesGenerationResult {
  notes: string;
  searchResultCount: number;
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} が設定されていません`);
  }
  return value;
}

function getAiErrorMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause);
  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota") ||
    message.includes("exceeded")
  ) {
    return "Gemini APIの利用上限に達しました。Google AI Studioの割り当て・請求設定を確認するか、時間を置いて再試行してください。";
  }
  return "Gemini APIの呼び出しに失敗しました。APIキー、モデル名、利用設定を確認してください。";
}

type TinyFishSearchResult = {
  title?: unknown;
  url?: unknown;
  snippet?: unknown;
  description?: unknown;
};

type TinyFishSearchResponse = {
  error?: unknown;
  results?: unknown;
};

type TinyFishFetchPage = {
  url?: unknown;
  title?: unknown;
  description?: unknown;
  text?: unknown;
};

type TinyFishFetchResponse = {
  results?: unknown;
  errors?: unknown;
};

async function searchTinyFish(
  name: string,
  developer?: string,
  categories: string[] = []
) {
  const apiKey = getRequiredEnv("TINYFISH_API_KEY");
  const query = [
    name.trim(),
    developer?.trim(),
    "音楽ゲーム",
    "操作方法",
    "ゲームシステム",
    "ゲームの特徴",
    "プレイスタイル",
    "対応機種",
    "遊び方",
    "ノーツ",
    "レーン",
    "判定",
    "タップ スライド 長押し",
    ...categories.slice(0, 3),
  ]
    .filter(Boolean)
    .join(" ");
  const url = new URL("https://api.search.tinyfish.ai");
  url.searchParams.set("query", query);
  url.searchParams.set(
    "purpose",
    "音楽ゲームの公式情報や特徴を確認し、備考説明を作成するための検索"
  );
  url.searchParams.set("location", "JP");
  url.searchParams.set("language", "ja");
  url.searchParams.set("domain_type", "web");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`TinyFish検索の呼び出しに失敗しました（${response.status}）`);
  }

  const result: unknown = await response.json();
  if (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "string"
  ) {
    throw new Error(`TinyFish検索エラー: ${result.error}`);
  }

  const searchResults =
    typeof result === "object" &&
    result !== null &&
    "results" in result
      ? (result as TinyFishSearchResponse).results
      : undefined;
  if (!Array.isArray(searchResults)) {
    return [];
  }

  return searchResults
    .map((item: unknown) => {
      if (typeof item !== "object" || item === null) return null;
      const candidate = item as TinyFishSearchResult;
      if (
        typeof candidate.title !== "string" ||
        typeof candidate.url !== "string"
      ) {
        return null;
      }
      const description =
        typeof candidate.snippet === "string"
          ? candidate.snippet
          : typeof candidate.description === "string"
            ? candidate.description
            : "";
      return {
        title: candidate.title,
        url: candidate.url,
        description,
      };
    })
    .filter((item): item is { title: string; url: string; description: string } =>
      Boolean(item)
    )
    .slice(0, 5);
}

async function fetchTinyFishPages(
  searchResults: Awaited<ReturnType<typeof searchTinyFish>>,
  apiKey: string
) {
  const response = await fetch("https://api.fetch.tinyfish.ai", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      urls: searchResults.map((result) => result.url),
      format: "markdown",
      purpose: "音楽ゲームの操作方法、ノーツ、レーン、判定、ゲームシステムの特徴を確認する",
      ttl: 3600,
      per_url_timeout_ms: 30_000,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    throw new Error(`TinyFish本文取得の呼び出しに失敗しました（${response.status}）`);
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("results" in payload) ||
    !Array.isArray((payload as TinyFishFetchResponse).results)
  ) {
    return searchResults;
  }

  const rawPages = (payload as TinyFishFetchResponse).results;
  if (!Array.isArray(rawPages)) {
    return searchResults;
  }

  const pages = rawPages
    .map((item: unknown) => {
      if (typeof item !== "object" || item === null) return null;
      const page = item as TinyFishFetchPage;
      if (typeof page.url !== "string" || typeof page.text !== "string") {
        return null;
      }
      return {
        url: page.url,
        text: page.text.slice(0, 8_000),
        title: typeof page.title === "string" ? page.title : "",
        description:
          typeof page.description === "string" ? page.description : "",
      };
    })
    .filter(
      (
        item
      ): item is {
        url: string;
        text: string;
        title: string;
        description: string;
      } => Boolean(item)
    );

  const pageByUrl = new Map(pages.map((page) => [page.url, page]));
  return searchResults.map((searchResult) => {
    const page = pageByUrl.get(searchResult.url);
    return page
      ? {
          ...searchResult,
          pageText: page.text,
          pageTitle: page.title,
          pageDescription: page.description,
        }
      : searchResult;
  });
}

export async function generateGameNotes(input: NotesGenerationInput) {
  if (!input.name.trim()) {
    throw new Error("ゲーム名を入力してください");
  }

  const searchResults = await searchTinyFish(
    input.name,
    input.developer,
    input.categories
  );
  if (searchResults.length === 0) {
    return {
      notes: `${input.name.trim()}のゲーム情報を確認しています。詳細は公式情報や信頼できる情報源をご確認ください。`,
      searchResultCount: 0,
    };
  }

  const tinyFishApiKey = getRequiredEnv("TINYFISH_API_KEY");
  let enrichedSearchResults = searchResults;
  try {
    enrichedSearchResults = await fetchTinyFishPages(searchResults, tinyFishApiKey);
  } catch (cause) {
    // 検索スニペットがある場合は、それを使って生成を続行する。
    console.warn("TinyFish本文取得をスキップしました", cause);
  }

  const apiKey = getRequiredEnv("GEMINI_API_KEY");
  const model = getRequiredEnv("GEMINI_MODEL");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = [
    "あなたは音楽ゲームのデータベース編集者です。",
    "入力されたゲームについて、備考・特徴説明を日本語で2文程度、150文字以内で作成してください。",
    "参照できる文章の書き方は、以下の6件の固定サンプルだけです。",
    "固定サンプルは文章の長さ・具体性・文体の参考にし、サンプルの事実を対象ゲームへ流用しないでください。",
    "入力フォームの情報とTinyFishの検索結果を組み合わせ、検索結果で確認できる事実だけを書いてください。",
    "検索結果は上位5件のみを使用し、検索結果にない情報は推測しないでください。",
    "検索結果が少ない場合でも、検索結果のタイトル・概要・URLと取得した本文から確認できる範囲で説明文を作成してください。",
    "検索結果が対象ゲームと完全には一致しない場合でも、入力フォームにある確定済みの情報と検索結果から読み取れる一般的な特徴を組み合わせ、控えめな説明文を作成してください。",
    "検索結果や入力フォームから確認できない具体的な事実は断定せず、「対応する」「採用する」などの表現を避けてください。",
    "情報が少ない場合も「情報が有りませんでした」だけを返さず、ゲーム名と確認できた情報を使って必ず1文を作成してください。",
    "説明は開発元や発売元の紹介だけにせず、ゲーム性・操作性を最優先してください。",
    "検索結果に根拠がある場合は、ノーツの種類、入力操作（タップ・スライド・長押しなど）、レーンや判定の仕組み、プレイ中の特徴を具体的に説明してください。",
    "ゲーム性・操作性が確認できない場合だけ、対応機種や開発元などの基本情報を補足してください。",
    "開発元だけが確認できる場合でも、「〇〇が開発する」だけで終わらせず、検索結果にあるゲーム内容をできるだけ説明してください。",
    "出力は説明文だけにし、前置き、箇条書き、引用符、Markdownを付けないでください。",
    "",
    "固定サンプル:",
    JSON.stringify(NOTE_REFERENCE_GAMES, null, 2),
    "",
    "TinyFish検索結果（上位5件）:",
    JSON.stringify(enrichedSearchResults, null, 2),
    "",
    "対象ゲームの入力情報:",
    JSON.stringify(input, null, 2),
  ].join("\n");

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction:
              "確認できない情報は断定せず、利用できる検索結果と入力情報が少ない場合も必ず短い説明文を返してください。",
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    });
  } catch (cause) {
    throw new Error(getAiErrorMessage(cause));
  }

  const content = response.text?.trim() || "";

  if (!content) {
    return {
      notes: `${input.name.trim()}のゲーム情報を確認しています。詳細は検索結果や公式情報をご確認ください。`,
      searchResultCount: searchResults.length,
    };
  }

  const normalizedContent = content
    .replace(/^["「]|["」]$/g, "")
    .trim();
  if (
    normalizedContent === NO_INFORMATION ||
    normalizedContent.includes("情報がありません") ||
    normalizedContent.includes("情報が有りません")
  ) {
    return {
      notes: `${input.name.trim()}のゲーム情報を確認しています。詳細は検索結果や公式情報をご確認ください。`,
      searchResultCount: searchResults.length,
    };
  }

  return {
    notes: normalizedContent,
    searchResultCount: searchResults.length,
  };
}
