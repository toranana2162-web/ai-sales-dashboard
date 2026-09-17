"use client";

import { useCallback, useEffect, useState } from "react";
import { UploadForm } from "@/components/upload/UploadForm";
import { KpiCards } from "@/components/kpi-cards/KpiCards";
import { TrendSection } from "@/components/charts/TrendSection";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { SkuRankingTable } from "@/components/charts/SkuRankingTable";
import type { KpiResponse, MonthlyTrendPoint } from "@/types/kpi";

function toMonthParam(targetMonth: string): string {
  // "2025-11-01" -> "2025-11"
  return targetMonth.slice(0, 7);
}

export default function Home() {
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [kpi, setKpi] = useState<KpiResponse | null>(null);
  const [trend, setTrend] = useState<MonthlyTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMonths = useCallback(async () => {
    const response = await fetch("/api/months");
    const data = await response.json();
    const fetchedMonths: string[] = data.months ?? [];
    setMonths(fetchedMonths);

    // 未選択、または選択中の月がデータから消えた場合は最新月を選び直す
    setSelectedMonth((current) => {
      if (current && fetchedMonths.includes(current)) return current;
      return fetchedMonths[0] ?? null;
    });
  }, []);

  useEffect(() => {
    void loadMonths();
  }, [loadMonths]);

  useEffect(() => {
    if (!selectedMonth) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const month = toMonthParam(selectedMonth);

    Promise.all([
      fetch(`/api/kpi?month=${month}`).then((r) => r.json().then((data) => ({ r, data }))),
      fetch(`/api/kpi/trend?month=${month}`).then((r) => r.json().then((data) => ({ r, data }))),
    ])
      .then(([kpiResult, trendResult]) => {
        if (cancelled) return;
        if (!kpiResult.r.ok) {
          setError(kpiResult.data.error ?? "データの取得に失敗しました。");
          setKpi(null);
          setTrend([]);
          return;
        }
        setKpi(kpiResult.data);
        setTrend(trendResult.r.ok ? trendResult.data.trend : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("通信に失敗しました。");
          setKpi(null);
          setTrend([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-navy">
          AI搭載 売上分析ダッシュボード
        </h1>
      </header>

      <UploadForm onUploaded={loadMonths} />

      <div className="flex items-center gap-3">
        <label htmlFor="month-select" className="text-sm text-zinc-700">
          対象月
        </label>
        <select
          id="month-select"
          value={selectedMonth ?? ""}
          onChange={(e) => setSelectedMonth(e.target.value)}
          disabled={months.length === 0}
          className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-navy focus:outline-none"
        >
          {months.length === 0 && <option value="">データがありません</option>}
          {months.map((m) => (
            <option key={m} value={m}>
              {toMonthParam(m)}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-zinc-500">読み込み中...</p>}

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {selectedMonth && kpi && <KpiCards kpi={kpi} />}

      <TrendSection trend={trend} />

      {kpi && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-700">補助分析</h2>
          <p className="text-sm text-zinc-600">
            販売数量: {kpi.totalQuantity.toLocaleString("ja-JP")}
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryBarChart data={kpi.categoryBreakdown} />
            <SkuRankingTable data={kpi.skuRanking} />
          </div>
        </section>
      )}
    </div>
  );
}
