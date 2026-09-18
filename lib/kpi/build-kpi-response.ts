import type { SupabaseClient } from "@supabase/supabase-js";
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
import type { KpiResponse } from "@/types/kpi";

/**
 * 対象月のKPIレスポンス一式を組み立てる。
 * `/api/kpi`と`/api/ai-report`の両方から使う共通ロジック。
 * 対象月のデータが存在しない場合はnullを返す。
 */
export async function buildKpiResponse(
  supabase: SupabaseClient,
  targetMonth: string,
): Promise<KpiResponse | null> {
  const targetExists = await monthHasData(supabase, targetMonth);
  if (!targetExists) return null;

  const [summary, categoryBreakdown, skuRanking, hasPriorData] =
    await Promise.all([
      getMonthlySummary(supabase, targetMonth),
      getCategoryBreakdown(supabase, targetMonth),
      getSkuRanking(supabase, targetMonth),
      hasSalesBefore(supabase, targetMonth),
    ]);

  if (!summary) return null;

  const repeatRate = computeRepeatRate(
    summary.unique_customers,
    summary.repeat_customers,
    hasPriorData,
  );
  const grossMarginRate = computeGrossMarginRate(
    summary.revenue,
    summary.gross_profit,
  );

  const previousMonth = getPreviousMonth(targetMonth);
  const previousExists = await monthHasData(supabase, previousMonth);

  let comparison: KpiResponse["comparison"];

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

  return {
    targetMonth,
    revenue: summary.revenue,
    grossProfit: summary.gross_profit,
    grossMarginRate,
    repeatRate,
    totalQuantity: summary.total_quantity,
    comparison,
    categoryBreakdown,
    skuRanking,
  };
}
