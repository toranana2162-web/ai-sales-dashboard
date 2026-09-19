import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { buildKpiResponse } from "@/lib/kpi/build-kpi-response";
import { buildAiInputPayload } from "@/lib/ai/input-payload";
import {
  AI_MODEL,
  createAnthropicClient,
  generateAiReport,
} from "@/lib/ai/generate-report";

/**
 * AI分析結果を取得する。既に生成済みならそれを返し、無ければ生成して保存する。
 * ARCHITECTURE.md 7.4章・7.5章に対応。
 *
 * 使い方: GET /api/ai-report?month=2025-11
 */
export async function GET(request: Request) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "monthパラメータをYYYY-MM形式で指定してください。" },
      { status: 400 },
    );
  }
  const targetMonth = `${month}-01`;

  const supabase = createAdminClient();

  // 1. 既存のAI分析結果があればそれを返す(27章前提:初回1回生成し再利用する)
  const { data: existing, error: fetchError } = await supabase
    .from("ai_reports")
    .select("summary, key_changes, top_contributors, notable_points, next_actions, generated_at")
    .eq("target_month", targetMonth)
    .maybeSingle();

  if (fetchError) {
    console.error("failed to fetch ai_reports:", fetchError);
    return NextResponse.json(
      { error: "AI分析結果の取得に失敗しました。" },
      { status: 500 },
    );
  }

  if (existing) {
    return NextResponse.json(existing);
  }

  // 2. 無ければ、KPIデータを組み立ててAIへ渡す
  const kpi = await buildKpiResponse(supabase, targetMonth);
  if (!kpi) {
    return NextResponse.json(
      { error: "指定された月のデータが見つかりません。" },
      { status: 404 },
    );
  }

  const inputPayload = buildAiInputPayload(kpi);

  let report;
  try {
    const anthropicClient = createAnthropicClient();
    report = await generateAiReport(anthropicClient, inputPayload);
  } catch (err) {
    // ARCHITECTURE.md 7.5章: AI失敗時はAI分析欄にのみエラーを返す(KPI表示には影響させない)
    console.error("AI report generation failed:", err);
    return NextResponse.json(
      {
        error:
          "AI分析を生成できませんでした。しばらくしてから再度お試しください。",
      },
      { status: 502 },
    );
  }

  // 3. 生成結果を保存する(次回以降は再利用する)
  const generatedAt = new Date().toISOString();
  const { error: insertError } = await supabase.from("ai_reports").insert({
    target_month: targetMonth,
    generated_at: generatedAt,
    model_used: AI_MODEL,
    input_payload: inputPayload,
    ...report,
  });

  if (insertError) {
    console.error("failed to save ai_reports:", insertError);
    // 保存に失敗しても、生成済みの内容はそのまま返す(次回アクセス時に再生成される)
  }

  return NextResponse.json({ ...report, generated_at: generatedAt });
}
