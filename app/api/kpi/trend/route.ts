import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { getMonthlyTrend } from "@/lib/kpi/rpc";

/**
 * 複数月の売上・粗利・リピート率の推移を返すAPI。
 * ARCHITECTURE.md 6.5章、REQUIREMENTSv2.md 14.2章に対応。
 *
 * 使い方: GET /api/kpi/trend?month=2025-11&months=12
 */
export async function GET(request: Request) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const monthsParam = searchParams.get("months");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "monthパラメータをYYYY-MM形式で指定してください。" },
      { status: 400 },
    );
  }

  const months = monthsParam ? Number(monthsParam) : 12;
  if (!Number.isInteger(months) || months < 1 || months > 60) {
    return NextResponse.json(
      { error: "monthsパラメータは1〜60の整数で指定してください。" },
      { status: 400 },
    );
  }

  const targetMonth = `${month}-01`;
  const supabase = createAdminClient();

  const trend = await getMonthlyTrend(supabase, targetMonth, months);

  return NextResponse.json({ trend });
}
