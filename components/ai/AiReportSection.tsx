type AiReport = {
  summary: string;
  key_changes: string;
  top_contributors: string;
  notable_points: string;
  next_actions: string;
};

const SECTIONS: { key: keyof AiReport; label: string }[] = [
  { key: "summary", label: "当月サマリー" },
  { key: "key_changes", label: "前月から大きく変化した点" },
  { key: "top_contributors", label: "売上への寄与が大きいカテゴリ・SKU" },
  { key: "notable_points", label: "注目すべきポイント" },
  { key: "next_actions", label: "次月のアクション提案" },
];

export function AiReportSection({
  report,
  loading,
  error,
}: {
  report: AiReport | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-700">AI分析</h2>

      {loading && (
        <p className="text-sm text-zinc-500">
          AIが分析中です（初回は生成に数秒かかります）...
        </p>
      )}

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && report && (
        <div className="space-y-4 rounded-lg border border-zinc-200 p-4">
          {SECTIONS.map(({ key, label }) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-navy">{label}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
                {report[key]}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
