import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createAdminClient } from "@/lib/db/supabase-admin";
import {
  computeGrossMarginRate,
  computeRepeatRate,
  getPreviousMonth,
} from "@/lib/kpi/calculations";
import {
  getCategoryBreakdown,
  getMonthlySummary,
  getSkuRanking,
  hasSalesBefore,
  monthHasData,
} from "@/lib/kpi/rpc";

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

  // 当月のデータが存在するか確認する
  const targetExists = await monthHasData(supabase, targetMonth);
  if (!targetExists) {
    return NextResponse.json(
      { error: "指定された月のデータが見つかりません。" },
      { status: 404 },
    );
  }

  // 当月のサマリー・カテゴリ別・SKU別を並行して取得する
  const [summary, categoryBreakdown, skuRanking, hasPriorData] =
    await Promise.all([
      getMonthlySummary(supabase, targetMonth),
      getCategoryBreakdown(supabase, targetMonth),
      getSkuRanking(supabase, targetMonth),
      hasSalesBefore(supabase, targetMonth),
    ]);

  if (!summary) {
    return NextResponse.json(
      { error: "指定された月のデータが見つかりません。" },
      { status: 404 },
    );
  }

  const repeatRate = computeRepeatRate(
    summary.unique_customers,
    summary.repeat_customers,
    hasPriorData,
  );
  const grossMarginRate = computeGrossMarginRate(
    summary.revenue,
    summary.gross_profit,
  );

  // 前月比較(REQUIREMENTsv2.md 11章:前月は暦月で1つ前の月)
  const previousMonth = getPreviousMonth(targetMonth);
  const previousExists = await monthHasData(supabase, previousMonth);

  let comparison: {
    available: boolean;
    revenue: number | null;
    grossProfit: number | null;
    repeatRate: number | null;
  };

  if (!previousExists) {
    comparison = {
      available: false,
      revenue: null,
      grossProfit: null,
      repeatRate: null,
    };
  } else {
    const [previousSummary, previousHasPriorData] = await Promise.all([
      getMonthlySummary(supabase, previousMonth),
      hasSalesBefore(supabase, previousMonth),
    ]);

    comparison = previousSummary
      ? {
          available: true,
          revenue: previousSummary.revenue,
          grossProfit: previousSummary.gross_profit,
          repeatRate: computeRepeatRate(
            previousSummary.unique_customers,
            previousSummary.repeat_customers,
            previousHasPriorData,
          ),
        }
      : { available: false, revenue: null, grossProfit: null, repeatRate: null };
  }

  return NextResponse.json({
    targetMonth,
    revenue: summary.revenue,
    grossProfit: summary.gross_profit,
    grossMarginRate,
    repeatRate,
    totalQuantity: summary.total_quantity,
    comparison,
    categoryBreakdown,
    skuRanking,
  });
}
