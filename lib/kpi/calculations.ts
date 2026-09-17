/**
 * KPIに関する計算ロジック(純粋な関数のみ、データベースアクセスは含まない)。
 * ARCHITECTURE.md 6.1章・6.2章に対応。
 */

/**
 * 対象月(YYYY-MM-DD)から、暦月で1つ前の月(YYYY-MM-DD)を求める。
 * REQUIREMENTSv2.md 11章:「前月」は暦月で1つ前の月と定義する。
 */
export function getPreviousMonth(targetMonth: string): string {
  const [year, month] = targetMonth.split("-").map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
}

/**
 * リピート率を計算する。算出できない場合はnullを返す。
 * REQUIREMENTSv2.md 10.4章:
 * - 識別できる顧客が0人の場合は「算出不可」
 * - 対象月より前のデータが1件も無い場合(初回導入時)も「算出不可」
 */
export function computeRepeatRate(
  uniqueCustomers: number,
  repeatCustomers: number,
  hasPriorData: boolean,
): number | null {
  if (uniqueCustomers === 0) return null;
  if (!hasPriorData) return null;
  return Math.round((repeatCustomers / uniqueCustomers) * 1000) / 10;
}

/**
 * 粗利率を計算する。売上が0の場合はnullを返す(0除算を避ける)。
 * REQUIREMENTSv2.md 10.3章。
 */
export function computeGrossMarginRate(
  revenue: number,
  grossProfit: number,
): number | null {
  if (revenue === 0) return null;
  return Math.round((grossProfit / revenue) * 1000) / 10;
}
