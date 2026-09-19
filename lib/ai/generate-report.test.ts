import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { AI_MODEL, generateAiReport } from "./generate-report";

function createMockClient(parsed_output: unknown) {
  return {
    messages: {
      parse: vi.fn().mockResolvedValue({ parsed_output }),
    },
  } as unknown as Anthropic;
}

describe("generateAiReport", () => {
  it("Claude APIから正しく解析された結果を返す", async () => {
    const fakeReport = {
      summary: "テストサマリー",
      key_changes: "テスト変化点",
      top_contributors: "テスト寄与",
      notable_points: "テスト注目点",
      next_actions: "テストアクション",
    };
    const client = createMockClient(fakeReport);

    const result = await generateAiReport(client, { target_month: "2025-11" });

    expect(result).toEqual(fakeReport);
  });

  it("指定したモデル(claude-haiku-4-5)でリクエストする", async () => {
    const client = createMockClient({
      summary: "s",
      key_changes: "k",
      top_contributors: "t",
      notable_points: "n",
      next_actions: "a",
    });

    await generateAiReport(client, { target_month: "2025-11" });

    expect(client.messages.parse).toHaveBeenCalledWith(
      expect.objectContaining({ model: AI_MODEL }),
    );
  });

  it("parsed_outputがnullの場合はエラーを投げる", async () => {
    const client = createMockClient(null);

    await expect(
      generateAiReport(client, { target_month: "2025-11" }),
    ).rejects.toThrow();
  });
});
