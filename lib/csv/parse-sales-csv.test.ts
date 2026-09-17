import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseSalesCsv } from "./parse-sales-csv";

function toBuffer(csvText: string): Buffer {
  return Buffer.from(csvText, "utf-8");
}

const HEADER = "order_date,customer_id,product_name,category,sku,quantity,revenue,cost";

describe("parseSalesCsv", () => {
  it("正常なCSVを正しく解析できる", () => {
    const csv = `${HEADER}
2025-11-01,C001,Tシャツ,トップス,SKU001,2,4000,2000
2025-11-05,C002,パンツ,ボトムス,SKU002,1,3000,1500`;

    const result = parseSalesCsv(toBuffer(csv));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.targetMonth).toBe("2025-11-01");
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].revenue).toBe(4000);
    }
  });

  it("必須列が不足している場合はエラーになる", () => {
    // cost列が無い
    const csv = `order_date,customer_id,product_name,category,sku,quantity,revenue
2025-11-01,C001,Tシャツ,トップス,SKU001,2,4000`;

    const result = parseSalesCsv(toBuffer(csv));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("必須列");
    }
  });

  it("データが1件も無い場合はエラーになる", () => {
    const csv = HEADER;

    const result = parseSalesCsv(toBuffer(csv));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("1件も");
    }
  });

  it("複数月のデータが混在している場合はエラーになる", () => {
    const csv = `${HEADER}
2025-11-01,C001,Tシャツ,トップス,SKU001,2,4000,2000
2025-12-01,C002,パンツ,ボトムス,SKU002,1,3000,1500`;

    const result = parseSalesCsv(toBuffer(csv));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("複数の月");
    }
  });

  it("返品による負数のrevenue/costを許容する", () => {
    const csv = `${HEADER}
2025-11-01,C001,Tシャツ,トップス,SKU001,-1,-2000,-1000`;

    const result = parseSalesCsv(toBuffer(csv));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rows[0].revenue).toBe(-2000);
      expect(result.rows[0].quantity).toBe(-1);
    }
  });

  it("customer_idが空の行はnullとして扱い、集計対象には含める", () => {
    const csv = `${HEADER}
2025-11-01,,Tシャツ,トップス,SKU001,1,2000,1000`;

    const result = parseSalesCsv(toBuffer(csv));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rows[0].customer_id).toBeNull();
    }
  });

  it("日付の形式が不正な場合はエラーになる", () => {
    const csv = `${HEADER}
2025/11/01,C001,Tシャツ,トップス,SKU001,1,2000,1000`;

    const result = parseSalesCsv(toBuffer(csv));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("行目");
    }
  });

  it("数値であるべき列に数値以外が入っている場合はエラーになる", () => {
    const csv = `${HEADER}
2025-11-01,C001,Tシャツ,トップス,SKU001,abc,2000,1000`;

    const result = parseSalesCsv(toBuffer(csv));

    expect(result.success).toBe(false);
  });

  it("実際のサンプルCSV(case8-sales-sample.csv)は複数月混在のためエラーになる", () => {
    // REQUIREMENTSv2.md 7章の正式サンプルは9月〜11月の3か月分が混在しているため、
    // 27章前提の「複数月混在はエラー」という仕様通りに拒否されることを確認する。
    const filePath = join(process.cwd(), "case8-sales-sample.csv");
    const buffer = readFileSync(filePath);

    const result = parseSalesCsv(buffer);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("複数の月");
    }
  });

  it("UTF-8として読めないバイト列の場合はエラーになる", () => {
    // 0xFF 0xFE はUTF-8として不正なバイト列
    const invalidUtf8 = Buffer.from([0xff, 0xfe, 0x00, 0x01]);

    const result = parseSalesCsv(invalidUtf8);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("UTF-8");
    }
  });
});
