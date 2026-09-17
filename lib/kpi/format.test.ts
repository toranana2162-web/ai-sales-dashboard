import { describe, expect, it } from "vitest";
import { computeChangeRate, formatCurrency, formatPercent } from "./format";

describe("formatCurrency", () => {
  it("3桁区切りの円表記にする", () => {
    expect(formatCurrency(264700)).toBe("¥264,700");
  });
});

describe("formatPercent", () => {
  it("小数点1桁のパーセント表記にする", () => {
    expect(formatPercent(61.6)).toBe("61.6%");
  });
});

describe("computeChangeRate", () => {
  it("増加した場合は正の値を返す", () => {
    expect(computeChangeRate(1100, 1000)).toBe(10);
  });

  it("減少した場合は負の値を返す", () => {
    expect(computeChangeRate(900, 1000)).toBe(-10);
  });

  it("前月が0の場合はnullを返す(0除算を避ける)", () => {
    expect(computeChangeRate(1000, 0)).toBeNull();
  });
});
