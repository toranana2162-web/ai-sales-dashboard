import type { KpiResponse } from "@/types/kpi";
import { computeChangeRate, formatCurrency, formatPercent } from "@/lib/kpi/format";

function ChangeLabel({
  changeRate,
  available,
}: {
  changeRate: number | null;
  available: boolean;
}) {
  if (!available) {
    return <p className="mt-1 text-xs text-zinc-400">前月比較データなし</p>;
  }
  if (changeRate === null) {
    return <p className="mt-1 text-xs text-zinc-400">前月比 算出不可</p>;
  }
  const sign = changeRate > 0 ? "+" : "";
  const color =
    changeRate > 0
      ? "text-green-600"
      : changeRate < 0
        ? "text-red-600"
        : "text-zinc-500";
  return (
    <p className={`mt-1 text-xs ${color}`}>
      前月比 {sign}
      {changeRate}%
    </p>
  );
}

export function KpiCards({ kpi }: { kpi: KpiResponse }) {
  const revenueChange = kpi.comparison.available
    ? computeChangeRate(kpi.revenue, kpi.comparison.revenue ?? 0)
    : null;
  const grossProfitChange = kpi.comparison.available
    ? computeChangeRate(kpi.grossProfit, kpi.comparison.grossProfit ?? 0)
    : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-sm text-zinc-500">売上</p>
        <p className="mt-1 text-2xl font-semibold text-navy">
          {formatCurrency(kpi.revenue)}
        </p>
        <ChangeLabel
          changeRate={revenueChange}
          available={kpi.comparison.available}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-sm text-zinc-500">粗利</p>
        <p className="mt-1 text-2xl font-semibold text-navy">
          {formatCurrency(kpi.grossProfit)}
        </p>
        {kpi.grossMarginRate !== null && (
          <p className="text-xs text-zinc-400">
            粗利率 {formatPercent(kpi.grossMarginRate)}
          </p>
        )}
        <ChangeLabel
          changeRate={grossProfitChange}
          available={kpi.comparison.available}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-sm text-zinc-500">リピート率</p>
        <p className="mt-1 text-2xl font-semibold text-navy">
          {kpi.repeatRate === null ? "算出不可" : formatPercent(kpi.repeatRate)}
        </p>
        {kpi.comparison.available ? (
          <p className="mt-1 text-xs text-zinc-400">
            前月:{" "}
            {kpi.comparison.repeatRate === null
              ? "算出不可"
              : formatPercent(kpi.comparison.repeatRate)}
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-400">前月比較データなし</p>
        )}
      </div>
    </div>
  );
}
