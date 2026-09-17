import { describe, expect, it } from "vitest";
import {
  computeGrossMarginRate,
  computeRepeatRate,
  getPreviousMonth,
} from "./calculations";

describe("getPreviousMonth", () => {
  it("通常の月は1つ前の月を返す", () => {
    expect(getPreviousMonth("2025-11-01")).toBe("2025-10-01");
  });

  it("1月の場合は前年の12月を返す", () => {
    expect(getPreviousMonth("2025-01-01")).toBe("2024-12-01");
  });
});

describe("computeRepeatRate", () => {
  it("識別できる顧客が0人の場合はnull(算出不可)を返す", () => {
    expect(computeRepeatRate(0, 0, true)).toBeNull();
  });

  it("対象月より前のデータが無い場合はnull(算出不可)を返す", () => {
    expect(computeRepeatRate(5, 0, false)).toBeNull();
  });

  it("正しくパーセントを計算する", () => {
    expect(computeRepeatRate(4, 1, true)).toBe(25);
  });

  it("前のデータがあり、リピーターが0人なら0%を返す(算出不可ではない)", () => {
    expect(computeRepeatRate(5, 0, true)).toBe(0);
  });
});

describe("computeGrossMarginRate", () => {
  it("売上が0の場合はnullを返す", () => {
    expect(computeGrossMarginRate(0, 0)).toBeNull();
  });

  it("正しく粗利率を計算する", () => {
    expect(computeGrossMarginRate(10000, 6000)).toBe(60);
  });
});
