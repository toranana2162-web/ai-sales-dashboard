"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryBreakdown } from "@/types/kpi";
import { formatCurrency } from "@/lib/kpi/format";

/**
 * カテゴリ別売上の棒グラフ。
 * 比較する対象は「売上」1種類のみで、カテゴリ名はX軸ラベルで分かるため、
 * 棒の色はすべて同じ(ブランドカラー)にする。
 */
export function CategoryBarChart({ data }: { data: CategoryBreakdown[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <h3 className="text-sm font-semibold text-zinc-700">カテゴリ別売上</h3>
      <div className="mt-2 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e4e4e7" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={{ stroke: "#e4e4e7" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v: number) => formatCurrency(v)}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="revenue" fill="#1a2e5c" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
