"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { month: string; value: number | null };

/**
 * 1系列の月次推移を表示する折れ線グラフ。
 * 系列が1本のみのため凡例は表示しない(タイトルが系列名を兼ねる)。
 * valueがnull(算出不可)の月は、線がつながらず欠損として表示される。
 */
export function TrendLineChart({
  title,
  data,
  valueFormatter,
}: {
  title: string;
  data: Point[];
  valueFormatter: (value: number) => string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
      <div className="mt-2 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e4e4e7" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={{ stroke: "#e4e4e7" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v: number) => valueFormatter(v)}
            />
            <Tooltip
              formatter={(value) =>
                value === null || value === undefined
                  ? "算出不可"
                  : valueFormatter(Number(value))
              }
              contentStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1a2e5c"
              strokeWidth={2}
              dot={{ r: 4, fill: "#1a2e5c" }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
