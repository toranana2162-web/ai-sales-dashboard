"use client";

import { useRef, useState, type FormEvent } from "react";

type UploadResult = {
  targetMonth: string;
  rowCount: number;
};

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("ファイルが選択されていません。");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "アップロードに失敗しました。");
        return;
      }

      setResult(data);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      setError(
        "通信に失敗しました。ネットワーク状況を確認して再度お試しください。",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-zinc-200 p-8">
        <div>
          <h1 className="text-xl font-semibold text-navy">
            AI搭載 売上分析ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Shopifyの売上CSVをアップロードしてください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-navy px-3 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {loading ? "アップロード中..." : "アップロード"}
          </button>
        </form>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {result && (
          <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            {result.targetMonth}分のデータを{result.rowCount}
            件登録しました。
          </p>
        )}

        <p className="text-xs text-zinc-400">
          （この画面は仮のものです。Milestone
          5で本来のダッシュボード画面に置き換えます）
        </p>
      </div>
    </div>
  );
}
