import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { buildKpiResponse } from "@/lib/kpi/build-kpi-response";

/**
 * 指定した月のKPI(売上・粗利・リピート率・前月比較・カテゴリ別・SKU別)を返すAPI。
 * ARCHITECTURE.md 6章、REQUIREMENTSv2.md 10章・11章・12章に対応。
 *
 * 使い方: GET /api/kpi?month=2025-11
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
  const kpi = await buildKpiResponse(supabase, targetMonth);

  if (!kpi) {
    return NextResponse.json(
      { error: "指定された月のデータが見つかりません。" },
      { status: 404 },
    );
  }

  return NextResponse.json(kpi);
}
