// app/api/kpi と app/api/kpi/trend のレスポンス形式に対応する型定義

export type CategoryBreakdown = { category: string; revenue: number };

export type SkuRanking = {
  sku: string;
  product_name: string;
  revenue: number;
};

export type Comparison = {
  available: boolean;
  revenue: number | null;
  grossProfit: number | null;
  repeatRate: number | null;
};

export type KpiResponse = {
  targetMonth: string;
  revenue: number;
  grossProfit: number;
  grossMarginRate: number | null;
  repeatRate: number | null;
  totalQuantity: number;
  comparison: Comparison;
  categoryBreakdown: CategoryBreakdown[];
  skuRanking: SkuRanking[];
};

export type MonthlyTrendPoint = {
  target_month: string;
  revenue: number;
  gross_profit: number;
  unique_customers: number;
  repeat_customers: number;
  repeat_rate: number | null;
};

export type TrendResponse = {
  trend: MonthlyTrendPoint[];
};
