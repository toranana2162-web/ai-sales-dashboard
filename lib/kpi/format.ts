/**
 * 画面表示用のフォーマット・前月比計算ロジック。
 */

export function formatCurrency(value: number): string {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/**
 * 前月からの変化率(%)を計算する。前月が0の場合は割り算できないためnullを返す。
 */
export function computeChangeRate(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
