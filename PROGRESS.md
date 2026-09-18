# 実装進捗メモ

最終更新: 2026-09-19

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.md、
日付ごとの記録はDEVLOG.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 5（ダッシュボードUI）はほぼ完了、残り2項目（レスポンシブ確認・ブラウザ動作確認）が途中。**

---

## 完了したこと

### Milestone 0〜4：省略（DEVLOG.md参照）

### Milestone 5: ダッシュボードUI（レスポンシブ・ブラウザ確認を除き完了）
- `app/page.tsx`：ダッシュボードのメイン画面（月選択・KPIカード・グラフ・補助分析をまとめて表示）
- `components/upload/UploadForm.tsx`：アップロードフォーム(部品化)
- `components/kpi-cards/KpiCards.tsx`：売上・粗利・リピート率のKPIカード(前月比・算出不可表示含む)
- `components/charts/TrendLineChart.tsx`・`TrendSection.tsx`：月次推移の折れ線グラフ3種+表(Recharts)
- `components/charts/CategoryBarChart.tsx`：カテゴリ別売上の棒グラフ
- `components/charts/SkuRankingTable.tsx`：SKU別売上TOP10の表
- `lib/kpi/format.ts`：前月比計算・通貨/パーセント表示のフォーマット関数(4件テスト)
- グラフ実装にあたりdatavizスキルを参照(単一系列のため凡例なし、ブランドカラーのネイビーを使用)

**動作確認済みの内容（ローカル環境で実際にブラウザから確認）**：
- 対象月切り替え、KPIカード（数値・前月比・算出不可表示）が正しく動作
- 月次推移グラフで「算出不可」の月が欠損として正しく表示される（線が途切れる）
- カテゴリ別売上・SKU別TOP10・販売数量が、11月の実データ(4カテゴリ・8SKU)で正しく表示される

**発生した問題と対応**：
- Next.js 16のデフォルトLintルール`react-hooks/set-state-in-effect`が、`useEffect`内でのデータ取得という一般的なパターンを一律エラーにしてしまうため、このルールのみ無効化（`eslint.config.mjs`にコメントで理由を記載）
- Rechartsのx軸ラベルが一部省略される問題 → `interval={0}`で解消
- SKU別ランキングの見出しが実件数に応じて「TOP1」等に変わってしまう問題 → 常に「TOP10」固定表示に修正

---

## 次にやること：Milestone 5の残り2項目 → その後Milestone 6

- [ ] レスポンシブ対応を確認する（スマートフォン幅で大きく崩れないか、ブラウザの開発者ツールで確認中）
- [ ] 主要な最新版Chromium系ブラウザでの動作確認

その後はMilestone 6（AI分析機能）に進む：
- `lib/ai/`にClaude APIクライアントを実装（モデル：`claude-haiku-4-5`）
- Structured Outputsで出力スキーマを定義
- システムプロンプトを実装
- `GET /api/ai-report`を実装
- ダッシュボードにAI分析結果を表示

**Milestone 6に進む前に、Anthropic APIキーの取得が必要**（`.env.local`の`ANTHROPIC_API_KEY`が未設定）。

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- テストは`npm test`（Vitest）で実行。CIへの組み込みはMilestone 7で予定通り実施
- 開発サーバーはポートが3000/3001と変わることがある
- 現在DBに入っている実データ：2025年11月(15件、正式サンプルCSVより)、2025年12月(C999さんのダミー1件)
