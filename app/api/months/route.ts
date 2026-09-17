import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/db/supabase-admin";

/**
 * データが存在する対象月の一覧を返すAPI。
 * ARCHITECTURE.md 9章、REQUIREMENTSv2.md 14.3章(月選択)に対応。
 */
export async function GET() {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("monthly_uploads")
    .select("target_month")
    .eq("status", "completed")
    .order("target_month", { ascending: false });

  if (error) {
    console.error("failed to fetch months:", error);
    return NextResponse.json(
      { error: "月一覧の取得に失敗しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    months: (data ?? []).map((row) => row.target_month),
  });
}
