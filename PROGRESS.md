# 実装進捗メモ

最終更新: 2026-09-19

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.md、
日付ごとの記録はDEVLOG.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 0〜6（プロジェクト基盤〜AI分析機能）のコード実装はすべて完了。** 1点だけ、Vercel（本番環境）への`ANTHROPIC_API_KEY`設定が未完了。

---

## 完了したこと

### Milestone 0〜5：省略（DEVLOG.md参照）

### Milestone 6: AI分析機能（コード実装は完了、本番環境変数の設定が残っている）
- Anthropic APIキーを取得し、`.env.local`に設定済み
- `lib/kpi/build-kpi-response.ts`：`/api/kpi`と`/api/ai-report`共通のKPI組み立てロジックとしてリファクタリング
- `lib/ai/input-payload.ts`：KPIデータをAI入力形式に変換（前月データが無い指標は`comparison_available: false`を明示。3件テスト）
- `lib/ai/generate-report.ts`：Claude APIクライアント（モデル：`claude-haiku-4-5`、Structured Outputs、システムプロンプト）。テストしやすいよう依存性注入の形にリファクタリング（3件テスト）
- `app/api/ai-report/route.ts`：既存レコードがあれば返す／無ければ生成して保存
- `components/ai/AiReportSection.tsx`：ダッシュボードでのAI分析結果表示（5セクション、エラー表示、生成中表示）

**動作確認済みの内容（ローカル環境で実際にブラウザから確認）**：
- 初回生成：11月分（比較データなし月）で、数値の捏造が無いこと、前月比較コメントをしないことを確認
- 12月分（比較データあり月）で、前月比99%減少という深刻な状況を適切なヘッジ表現で指摘することを確認
- 再アクセス時に再生成されず、保存済みの結果がそのまま返る（`generated_at`が変化しない）ことを確認
- `ai_reports`行を削除して再アクセスすると、正しく再生成されることを確認（依存性注入リファクタリング後も動作確認済み）

**残っているタスク**：
- [ ] Vercel（本番環境）の環境変数に`ANTHROPIC_API_KEY`を追加し、再デプロイする

---

## 次にやること：Milestone 7（CI/CD）

Vercelへの環境変数設定が終わったら、Milestone 7へ進む：
- [ ] 基本CIパイプライン（`pr-check.yml`）へテスト実行ステップを追加する（Milestone3・4・6で追加した単体テスト、現在39件）
- [ ] Vercelとの自動デプロイ連携を確認する
- [ ] mainブランチ保護ルールを最終確認する

その後 Milestone 8（セキュリティ・非機能要件の確認）→ Milestone 9（受け入れテスト）で完了。

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key・APIキー等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- テストは`npm test`（Vitest、現在39件）で実行。CIへの組み込みはMilestone 7で予定通り実施
- 現在DBに入っている実データ：2025年11月(15件、正式サンプルCSVより)、2025年12月(C999さんのダミー1件)
- `ai_reports`には11月・12月ともに生成済みのレコードがある
