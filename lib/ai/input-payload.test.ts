import { describe, expect, it } from "vitest";
import { buildAiInputPayload } from "./input-payload";
import type { KpiResponse } from "@/types/kpi";

function makeKpi(overrides: Partial<KpiResponse> = {}): KpiResponse {
  return {
    targetMonth: "2025-11-01",
    revenue: 264700,
    grossProfit: 163100,
    grossMarginRate: 61.6,
    repeatRate: null,
    totalQuantity: 21,
    comparison: { available: false, revenue: null, grossProfit: null, repeatRate: null },
    categoryBreakdown: [{ category: "アウター", revenue: 198200 }],
    skuRanking: [{ sku: "LUM-OUT-01", product_name: "ウールコート", revenue: 99200 }],
    ...overrides,
  };
}

describe("buildAiInputPayload", () => {
  it("前月データが無い場合、comparison_availableをfalseにし、previousをnullにする", () => {
    const payload = buildAiInputPayload(makeKpi());

    expect(payload.revenue.comparison_available).toBe(false);
    expect(payload.revenue.previous).toBeNull();
    expect(payload.gross_profit.comparison_available).toBe(false);
    expect(payload.repeat_rate.comparison_available).toBe(false);
  });

  it("前月データがある場合、previousに値を入れる", () => {
    const payload = buildAiInputPayload(
      makeKpi({
        comparison: {
          available: true,
          revenue: 200000,
          grossProfit: 120000,
          repeatRate: 25,
        },
      }),
    );

    expect(payload.revenue).toEqual({
      current: 264700,
      previous: 200000,
      comparison_available: true,
    });
    expect(payload.repeat_rate.previous).toBe(25);
  });

  it("カテゴリ別・SKU別・数量をそのまま含める", () => {
    const payload = buildAiInputPayload(makeKpi());

    expect(payload.category_breakdown).toEqual([
      { category: "アウター", revenue: 198200 },
    ]);
    expect(payload.sku_ranking_top10).toEqual([
      { sku: "LUM-OUT-01", product_name: "ウールコート", revenue: 99200 },
    ]);
    expect(payload.quantity).toEqual({ current: 21 });
  });
});
