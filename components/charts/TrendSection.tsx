import type { MonthlyTrendPoint } from "@/types/kpi";
import { formatCurrency, formatPercent } from "@/lib/kpi/format";
import { TrendLineChart } from "./TrendLineChart";

function toMonthLabel(targetMonth: string): string {
  const [, month] = targetMonth.split("-");
  return `${Number(month)}月`;
}

export function TrendSection({ trend }: { trend: MonthlyTrendPoint[] }) {
  if (trend.length === 0) {
    return null;
  }

  const revenueData = trend.map((t) => ({
    month: toMonthLabel(t.target_month),
    value: t.revenue,
  }));
  const grossProfitData = trend.map((t) => ({
    month: toMonthLabel(t.target_month),
    value: t.gross_profit,
  }));
  const repeatRateData = trend.map((t) => ({
    month: toMonthLabel(t.target_month),
    value: t.repeat_rate,
  }));

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-700">月次推移</h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TrendLineChart
          title="月次売上推移"
          data={revenueData}
          valueFormatter={formatCurrency}
        />
        <TrendLineChart
          title="月次粗利推移"
          data={grossProfitData}
          valueFormatter={formatCurrency}
        />
        <TrendLineChart
          title="リピート率推移"
          data={repeatRateData}
          valueFormatter={(v) => formatPercent(v)}
        />
      </div>

      {/* グラフと同じ内容を表でも確認できるようにする */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">月</th>
              <th className="px-3 py-2 font-medium">売上</th>
              <th className="px-3 py-2 font-medium">粗利</th>
              <th className="px-3 py-2 font-medium">リピート率</th>
            </tr>
          </thead>
          <tbody>
            {trend.map((t) => (
              <tr key={t.target_month} className="border-t border-zinc-100">
                <td className="px-3 py-2 text-zinc-700">
                  {toMonthLabel(t.target_month)}
                </td>
                <td className="px-3 py-2 tabular-nums text-zinc-700">
                  {formatCurrency(t.revenue)}
                </td>
                <td className="px-3 py-2 tabular-nums text-zinc-700">
                  {formatCurrency(t.gross_profit)}
                </td>
                <td className="px-3 py-2 tabular-nums text-zinc-700">
                  {t.repeat_rate === null ? "算出不可" : formatPercent(t.repeat_rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
