import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Milestone 1で作成したRPC関数を呼び出す窓口となる関数群。
 * ARCHITECTURE.md 6章に対応。
 *
 * すべての関数は、呼び出す側(APIルート)がSupabaseクライアントを渡す形にしている。
 * こうすることで、テスト時に本物のデータベースの代わりに
 * 「ふり」をするクライアント(モック)を渡してテストできる。
 */

export type MonthlySummary = {
  revenue: number;
  gross_profit: number;
  unique_customers: number;
  repeat_customers: number;
  total_quantity: number;
};

export async function getMonthlySummary(
  supabase: SupabaseClient,
  targetMonth: string,
): Promise<MonthlySummary | null> {
  const { data, error } = await supabase
    .rpc("get_monthly_summary", { p_target_month: targetMonth })
    .single();

  if (error) throw error;
  return data as MonthlySummary | null;
}

export type CategoryBreakdown = { category: string; revenue: number };

export async function getCategoryBreakdown(
  supabase: SupabaseClient,
  targetMonth: string,
): Promise<CategoryBreakdown[]> {
  const { data, error } = await supabase.rpc("get_category_breakdown", {
    p_target_month: targetMonth,
  });

  if (error) throw error;
  return (data as CategoryBreakdown[]) ?? [];
}

export type SkuRanking = {
  sku: string;
  product_name: string;
  revenue: number;
};

export async function getSkuRanking(
  supabase: SupabaseClient,
  targetMonth: string,
  limit = 10,
): Promise<SkuRanking[]> {
  const { data, error } = await supabase.rpc("get_sku_ranking", {
    p_target_month: targetMonth,
    p_limit: limit,
  });

  if (error) throw error;
  return (data as SkuRanking[]) ?? [];
}

export type MonthlyTrendPoint = {
  target_month: string;
  revenue: number;
  gross_profit: number;
  unique_customers: number;
  repeat_customers: number;
  repeat_rate: number | null;
};

export async function getMonthlyTrend(
  supabase: SupabaseClient,
  targetMonth: string,
  months = 12,
): Promise<MonthlyTrendPoint[]> {
  const { data, error } = await supabase.rpc("get_monthly_trend", {
    p_target_month: targetMonth,
    p_months: months,
  });

  if (error) throw error;
  return (data as MonthlyTrendPoint[]) ?? [];
}

/**
 * 対象月より前のデータが1件でも存在するかを確認する。
 * リピート率が「0%」なのか「算出不可」なのかを区別するために使う
 * (ARCHITECTURE.md 6.1章)。
 * これは複雑な集計ではないため、RPCではなく通常のテーブル検索で行う。
 */
export async function hasSalesBefore(
  supabase: SupabaseClient,
  targetMonth: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("sales_transactions")
    .select("id")
    .lt("order_date", targetMonth)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/**
 * 指定した月のデータがmonthly_uploadsに存在するかを確認する。
 * 前月比較で「比較データなし」を判定するために使う(REQUIREMENTSv2.md 11章)。
 */
export async function monthHasData(
  supabase: SupabaseClient,
  targetMonth: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("monthly_uploads")
    .select("target_month")
    .eq("target_month", targetMonth)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}
