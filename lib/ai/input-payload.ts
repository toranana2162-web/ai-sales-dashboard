import type { KpiResponse } from "@/types/kpi";

/**
 * AIへ渡す構造化データを組み立てる。
 * ARCHITECTURE.md 7.2章に対応。
 *
 * 前月データが無い指標は、値をnullにするだけでなく comparison_available: false を
 * 明示することで、AIが「前月と比較して〜」のようなコメントを作らないようにする。
 */
export function buildAiInputPayload(kpi: KpiResponse) {
  const available = kpi.comparison.available;

  return {
    target_month: kpi.targetMonth.slice(0, 7),
    revenue: {
      current: kpi.revenue,
      previous: available ? kpi.comparison.revenue : null,
      comparison_available: available,
    },
    gross_profit: {
      current: kpi.grossProfit,
      previous: available ? kpi.comparison.grossProfit : null,
      comparison_available: available,
    },
    repeat_rate: {
      current: kpi.repeatRate,
      previous: available ? kpi.comparison.repeatRate : null,
      comparison_available: available,
    },
    category_breakdown: kpi.categoryBreakdown,
    sku_ranking_top10: kpi.skuRanking,
    quantity: { current: kpi.totalQuantity },
  };
}
