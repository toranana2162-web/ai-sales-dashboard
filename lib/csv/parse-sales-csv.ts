import { parse } from "csv-parse/sync";
import { z } from "zod";

// REQUIREMENTSv2.md 7章：CSVの必須8列
const REQUIRED_COLUMNS = [
  "order_date",
  "customer_id",
  "product_name",
  "category",
  "sku",
  "quantity",
  "revenue",
  "cost",
] as const;

// YYYY-MM-DD形式かどうか、実在する日付かどうかを確認する
const dateStringSchema = z
  .string()
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: "order_dateはYYYY-MM-DD形式である必要があります",
  })
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), {
    message: "order_dateが実在する日付ではありません",
  });

// 1行分のバリデーションルール
// quantity/revenue/costは返品による負数も許容する(REQUIREMENTSv2.md 7.3章)
const rowSchema = z.object({
  order_date: dateStringSchema,
  customer_id: z
    .string()
    .transform((v) => (v.trim() === "" ? null : v))
    .nullable(),
  product_name: z.string(),
  category: z.string(),
  sku: z.string(),
  quantity: z.coerce.number({ message: "quantityが数値ではありません" }),
  revenue: z.coerce.number({ message: "revenueが数値ではありません" }),
  cost: z.coerce.number({ message: "costが数値ではありません" }),
});

export type SalesRow = z.infer<typeof rowSchema>;

export type ParseSalesCsvResult =
  | { success: true; targetMonth: string; rows: SalesRow[] }
  | { success: false; error: string };

/**
 * アップロードされたCSVファイルのバイト列を検証・変換する。
 * REQUIREMENTSv2.md 8章の検証項目に対応。
 */
export function parseSalesCsv(buffer: Buffer): ParseSalesCsvResult {
  // 1. UTF-8としてデコードできるか(REQUIREMENTSv2.md 8.2章)
  let text: string;
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    text = decoder.decode(buffer);
  } catch {
    return {
      success: false,
      error:
        "ファイルをUTF-8として読み込めませんでした。文字コードを確認してください。",
    };
  }

  // 2. CSVとして解析できるか
  let records: Record<string, string>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { success: false, error: "CSVの形式が正しくありません。" };
  }

  // 3. データが1件以上存在するか(REQUIREMENTSv2.md 8.1章)
  if (records.length === 0) {
    return { success: false, error: "CSVにデータが1件も含まれていません。" };
  }

  // 4. 必須8列が存在するか(REQUIREMENTSv2.md 8.1章)
  const columns = Object.keys(records[0]);
  const missingColumns = REQUIRED_COLUMNS.filter(
    (c) => !columns.includes(c),
  );
  if (missingColumns.length > 0) {
    return {
      success: false,
      error: `必須列が不足しています: ${missingColumns.join(", ")}`,
    };
  }

  // 5. 各行の型・値を検証する
  const rows: SalesRow[] = [];
  for (let i = 0; i < records.length; i++) {
    const result = rowSchema.safeParse(records[i]);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "不正な値です";
      // +2 = ヘッダー行(1行目)の分と、配列が0始まりである分の補正
      return {
        success: false,
        error: `${i + 2}行目のデータが不正です: ${message}`,
      };
    }
    rows.push(result.data);
  }

  // 6. 全行が同じ月かどうかを確認し、対象月を自動判定する(REQUIREMENTSv2.md 27章前提)
  const months = new Set(rows.map((r) => r.order_date.slice(0, 7)));
  if (months.size > 1) {
    return {
      success: false,
      error:
        "CSV内に複数の月のデータが混在しています。1つの月のみを含むCSVをアップロードしてください。",
    };
  }

  const targetMonth = `${[...months][0]}-01`;

  return { success: true, targetMonth, rows };
}
