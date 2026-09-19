import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// ARCHITECTURE.md 7.1章: 数値フィールドを含まない、文章のみのスキーマ。
// これにより、AIの出力から数値がそのまま画面に使われる経路が構造的に無くなる。
export const AiReportSchema = z.object({
  summary: z.string(),
  key_changes: z.string(),
  top_contributors: z.string(),
  notable_points: z.string(),
  next_actions: z.string(),
});

export type AiReport = z.infer<typeof AiReportSchema>;

export const AI_MODEL = "claude-haiku-4-5";

// ARCHITECTURE.md 7.3章: トーン・推測表現・比較データなし時の扱いを指示する。
const SYSTEM_PROMPT = `あなたは、ECブランド(アパレル)の経営者・マーケティング担当者へ向けて
売上データを分析するコンサルタントです。以下のルールを必ず守ってください。

- コンサルタントが経営会議で説明するような、丁寧で分かりやすいトーンで書いてください
- 数値はすべてユーザーから渡されたデータに含まれるものだけを使ってください。
  渡されていない数値を新しく作り出してはいけません
- データだけでは分からない「原因」を断定してはいけません。推測を述べる場合は
  「〜の可能性があります」「〜と考えられます」「〜の確認をおすすめします」のような、
  事実と推測を区別できる表現を使ってください
- 入力データの comparison_available が false の指標については、
  前月との比較についてコメントしないでください`;

/**
 * Claude APIクライアントを作成する。ANTHROPIC_API_KEY環境変数から認証情報を読み込む。
 */
export function createAnthropicClient(): Anthropic {
  return new Anthropic();
}

/**
 * KPIの構造化データをもとに、AI分析コメントを生成する。
 * ARCHITECTURE.md 7章に対応。
 *
 * client を引数で受け取る形にしているのは、テスト時に本物のAPIを呼ぶ代わりに
 * 「ふり」をするクライアント(モック)を渡せるようにするため。
 */
export async function generateAiReport(
  client: Anthropic,
  inputPayload: object,
): Promise<AiReport> {
  const response = await client.messages.parse({
    model: AI_MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `以下は、ある月の売上データの集計結果です。この内容をもとに分析コメントを作成してください。\n\n${JSON.stringify(inputPayload, null, 2)}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(AiReportSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("AIの応答を解析できませんでした。");
  }

  return response.parsed_output;
}
