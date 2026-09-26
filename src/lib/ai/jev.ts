const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const JEV_MODEL = "jev-latest";

export interface JevEvidenceInput {
  gameName: string;
  developer?: string;
  officialUrl?: string;
  searchResults: Array<{
    title: string;
    url: string;
    description: string;
    pageText?: string;
    pageTitle?: string;
    pageDescription?: string;
  }>;
}

export interface JevEvidenceResult {
  sourceMatchesGame: number;
  evidenceSufficient: number;
  accepted: boolean;
}

function readScore(answers: unknown, key: string): number {
  const answer =
    typeof answers === "object" && answers !== null && key in answers
      ? (answers as Record<string, unknown>)[key]
      : undefined;
  const score =
    typeof answer === "object" && answer !== null && "noul" in answer
      ? answer.noul
      : undefined;

  if (typeof score !== "number" || !Number.isFinite(score)) {
    console.warn("Jev score is missing or invalid", { question: key });
    return 0;
  }

  return score;
}

export async function evaluateTinyFishEvidence(
  input: JevEvidenceInput,
): Promise<JevEvidenceResult> {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("TYPESAFE_API_KEY が設定されていません");
  }

  const response = await fetch(JEV_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: JEV_MODEL,
      state: {
        targetGame: {
          name: input.gameName,
          developer: input.developer ?? "",
          officialUrl: input.officialUrl ?? "",
        },
        tinyFishResults: input.searchResults,
      },
      questions: {
        source_matches_game: {
          type: "noul",
          instructions: `
      対象ゲーム「${input.gameName}」について、TinyFishの検索結果の中に、
      対象ゲームそのものだと確認できる強い証拠が1件以上ありますか。

      以下を強い証拠として扱ってください。
      - 対象ゲームの公式サイト
      - 開発元・運営元の公式ページ
      - 対象ゲームについて具体的に説明している記事
      - 対象ゲームのゲーム画面、操作方法、ゲームシステムを具体的に説明しているページ

      検索結果の全件が対象ゲームである必要はありません。
      一部に無関係な検索結果や弱い結果が含まれていても、
      強い証拠が1件以上あればtrueにしてください。

      同名の別作品や完全に無関係なページしかない場合のみfalseにしてください。
      `,
        },

        evidence_sufficient: {
          type: "noul",
          instructions: `
      対象ゲーム「${input.gameName}」について、
      TinyFishの検索結果または取得本文の中に、
      ゲームの特徴説明を書くための具体的な証拠が1件以上ありますか。

      特に以下の情報を重視してください。
      - 操作方法
      - ノーツ
      - レーン
      - 入力デバイス
      - ゲームシステム
      - プレイ方法
      - ゲーム性

      1つの強いページだけで十分な場合はtrueにしてください。
      検索結果全体が完全である必要はありません。

      対象ゲームの存在だけ確認でき、ゲーム内容が全く分からない場合のみfalseにしてください。
      `,
        },
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Jev API error: ${response.status}`);
  }

  const payload: unknown = await response.json();
  const answers =
    typeof payload === "object" && payload !== null && "answers" in payload
      ? payload.answers
      : undefined;

  const sourceMatchesGame = readScore(answers, "source_matches_game");

  const evidenceSufficient = readScore(answers, "evidence_sufficient");

  console.log("Jev evaluation:", {
    sourceMatchesGame,
    evidenceSufficient,
    accepted:
      sourceMatchesGame >= 0.8 &&
      evidenceSufficient >= 0.8,
  });

  return {
    sourceMatchesGame,
    evidenceSufficient,
    accepted:
      sourceMatchesGame >= 0.8 &&
      evidenceSufficient >= 0.8,
  };
}
