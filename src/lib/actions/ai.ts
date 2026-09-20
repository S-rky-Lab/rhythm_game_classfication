"use server";

import { GoogleGenAI } from "@google/genai";
import { headers } from "next/headers";
import { NOTE_REFERENCE_GAMES } from "@/lib/ai/sample-games";
import { evaluateTinyFishEvidence } from "@/lib/ai/jev";

const NO_INFORMATION = "情報が有りませんでした";
const AI_GENERATION_ERROR_MESSAGE = "AI生成に失敗しました";
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

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
  error?: string;
}

/** Returns a required environment variable or throws when it is unavailable. */
function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} が設定されていません`);
  }
  return value;
}

/** Converts a Gemini failure into a user-facing error message. */
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

function maskErrorCause(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause);
  if (/429|RESOURCE_EXHAUSTED|quota|exceeded/i.test(message)) {
    return "rate_or_quota";
  }
  if (/TINYFISH_API_KEY|GEMINI_API_KEY|GEMINI_MODEL|設定されていません/i.test(message)) {
    return "configuration";
  }
  if (/TinyFish/i.test(message)) {
    return "search_provider";
  }
  if (/Gemini/i.test(message)) {
    return "ai_provider";
  }
  if (/origin|host/i.test(message)) {
    return "access_control";
  }
  if (/rate limit/i.test(message)) {
    return "rate_limit";
  }
  return "unknown";
}

function getClientIp(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return (
    requestHeaders.get("x-real-ip") ||
    requestHeaders.get("cf-connecting-ip") ||
    "unknown"
  );
}

function assertSameOrigin(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  if (!origin || !host) return;

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error("invalid origin");
  }

  if (originHost !== host) {
    throw new Error("origin does not match host");
  }
}

function assertWithinRateLimit(identifier: string) {
  const now = Date.now();
  const current = rateLimitStore.get(identifier);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new Error("rate limit exceeded");
  }

  current.count += 1;
}

async function assertCanGenerateGameNotes() {
  const requestHeaders = await headers();
  assertSameOrigin(requestHeaders);
  assertWithinRateLimit(getClientIp(requestHeaders));
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

/** Searches TinyFish for evidence about a rhythm game. */
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

/** Enriches TinyFish search results with fetched page content. */
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

/** Generates evidence-based notes and associated search metadata. */
async function generateGameNotesInternal(
  input: NotesGenerationInput
): Promise<NotesGenerationResult> {
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
      notes: NO_INFORMATION,
      searchResultCount: 0,
    };
  }

  const tinyFishApiKey = getRequiredEnv("TINYFISH_API_KEY");
  let enrichedSearchResults = searchResults;
  try {
    enrichedSearchResults = await fetchTinyFishPages(searchResults, tinyFishApiKey);
  } catch (cause) {
    // 検索スニペットがある場合は、それを使って生成を続行する。
    console.warn("TinyFish本文取得をスキップしました", {
      cause: maskErrorCause(cause),
    });
  }

  console.log(
    "TinyFish evidence for Jev:",
    JSON.stringify(enrichedSearchResults, null, 2),
  );

  const jevResult = await evaluateTinyFishEvidence({
    gameName: input.name,
    developer: input.developer,
    officialUrl: input.officialUrl,
    searchResults: enrichedSearchResults,
  });

  if (!jevResult.accepted) {
    return {
      notes: NO_INFORMATION,
      searchResultCount: searchResults.length,
    };
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
    "検索結果が対象ゲームと一致しない場合は、説明文を作成せず「情報が有りませんでした」だけを返してください。",
    "検索結果が少ない場合は、検索結果のタイトル・概要・URLと取得した本文から対象ゲームの特徴を確認できる場合だけ説明文を作成してください。",
    "証拠が不十分な場合は、説明文を作成せず「情報が有りませんでした」だけを返してください。",
    "検索結果や入力フォームから確認できない具体的な事実は断定せず、「対応する」「採用する」などの表現を避けてください。",
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
              "検索結果が対象ゲームと一致しない場合や証拠が不十分な場合は、必ず「情報が有りませんでした」だけを返してください。",
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
      notes: NO_INFORMATION,
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
      notes: NO_INFORMATION,
      searchResultCount: searchResults.length,
    };
  }

  return {
    notes: normalizedContent,
    searchResultCount: searchResults.length,
  };
}

/** Generates game notes while returning action failures in the result shape. */
export async function generateGameNotes(
  input: NotesGenerationInput
): Promise<NotesGenerationResult> {
  try {
    await assertCanGenerateGameNotes();
    return await generateGameNotesInternal(input);
  } catch (cause) {
    console.error("generateGameNotes failed", {
      cause: maskErrorCause(cause),
    });
    return {
      notes: "",
      searchResultCount: 0,
      error: AI_GENERATION_ERROR_MESSAGE,
    };
  }
}
