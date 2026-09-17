import type { SkuRanking } from "@/types/kpi";
import { formatCurrency } from "@/lib/kpi/format";

/**
 * SKU別売上ランキング(TOP10)の表。
 * REQUIREMENTSv2.md 12.2章:SKUが10種類未満の場合は、存在するSKUをすべて表示する。
 * (APIが返す件数をそのまま表示すればよく、特別な分岐は不要)
 */
export function SkuRankingTable({ data }: { data: SkuRanking[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <h3 className="text-sm font-semibold text-zinc-700">
        SKU別売上TOP{data.length}
      </h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="px-2 py-1.5 font-medium">順位</th>
              <th className="px-2 py-1.5 font-medium">SKU</th>
              <th className="px-2 py-1.5 font-medium">商品名</th>
              <th className="px-2 py-1.5 font-medium">売上</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.sku} className="border-t border-zinc-100">
                <td className="px-2 py-1.5 tabular-nums text-zinc-500">
                  {index + 1}
                </td>
                <td className="px-2 py-1.5 text-zinc-700">{row.sku}</td>
                <td className="px-2 py-1.5 text-zinc-700">
                  {row.product_name}
                </td>
                <td className="px-2 py-1.5 tabular-nums text-zinc-700">
                  {formatCurrency(row.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
