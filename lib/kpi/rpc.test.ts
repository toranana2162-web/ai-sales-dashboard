import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  getCategoryBreakdown,
  getMonthlySummary,
  getMonthlyTrend,
  getSkuRanking,
  hasSalesBefore,
  monthHasData,
} from "./rpc";

/**
 * Supabaseクライアントの「ふり」をするモックを作る。
 * .rpc()や.from()の後に.select()/.eq()/.lt()/.limit()/.single()/.maybeSingle()と
 * 好きなだけ連結でき、最終的にawaitすると指定した結果が返る。
 */
function createQueryMock(result: { data: unknown; error: unknown }) {
  const mock: Record<string, unknown> = {
    select: vi.fn(() => mock),
    lt: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return mock;
}

function createMockSupabase(result: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn(() => createQueryMock(result)),
    from: vi.fn(() => createQueryMock(result)),
  } as unknown as SupabaseClient;
}

describe("getMonthlySummary", () => {
  it("正常時はデータを返す", async () => {
    const summary = {
      revenue: 10000,
      gross_profit: 6000,
      unique_customers: 1,
      repeat_customers: 0,
      total_quantity: 5,
    };
    const supabase = createMockSupabase({ data: summary, error: null });

    const result = await getMonthlySummary(supabase, "2025-11-01");

    expect(result).toEqual(summary);
  });

  it("エラー時は例外を投げる", async () => {
    const supabase = createMockSupabase({
      data: null,
      error: new Error("db error"),
    });

    await expect(getMonthlySummary(supabase, "2025-11-01")).rejects.toThrow();
  });
});

describe("getCategoryBreakdown", () => {
  it("カテゴリ別売上の配列を返す", async () => {
    const rows = [{ category: "トップス", revenue: 1000 }];
    const supabase = createMockSupabase({ data: rows, error: null });

    const result = await getCategoryBreakdown(supabase, "2025-11-01");

    expect(result).toEqual(rows);
  });

  it("dataがnullの場合は空配列を返す", async () => {
    const supabase = createMockSupabase({ data: null, error: null });

    const result = await getCategoryBreakdown(supabase, "2025-11-01");

    expect(result).toEqual([]);
  });
});

describe("getSkuRanking", () => {
  it("SKUランキングの配列を返す", async () => {
    const rows = [{ sku: "SKU001", product_name: "Tシャツ", revenue: 5000 }];
    const supabase = createMockSupabase({ data: rows, error: null });

    const result = await getSkuRanking(supabase, "2025-11-01");

    expect(result).toEqual(rows);
  });
});

describe("getMonthlyTrend", () => {
  it("複数月の推移データを返す", async () => {
    const rows = [
      { target_month: "2025-11-01", revenue: 10000, gross_profit: 6000, unique_customers: 1, repeat_customers: 0, repeat_rate: null },
    ];
    const supabase = createMockSupabase({ data: rows, error: null });

    const result = await getMonthlyTrend(supabase, "2025-11-01");

    expect(result).toEqual(rows);
  });
});

describe("hasSalesBefore", () => {
  it("対象月より前のデータがあればtrueを返す", async () => {
    const supabase = createMockSupabase({ data: [{ id: 1 }], error: null });

    const result = await hasSalesBefore(supabase, "2025-12-01");

    expect(result).toBe(true);
  });

  it("対象月より前のデータが無ければfalseを返す", async () => {
    const supabase = createMockSupabase({ data: [], error: null });

    const result = await hasSalesBefore(supabase, "2025-11-01");

    expect(result).toBe(false);
  });
});

describe("monthHasData", () => {
  it("その月のデータが存在すればtrueを返す", async () => {
    const supabase = createMockSupabase({
      data: { target_month: "2025-10-01" },
      error: null,
    });

    const result = await monthHasData(supabase, "2025-10-01");

    expect(result).toBe(true);
  });

  it("その月のデータが無ければfalseを返す", async () => {
    const supabase = createMockSupabase({ data: null, error: null });

    const result = await monthHasData(supabase, "2025-08-01");

    expect(result).toBe(false);
  });
});
