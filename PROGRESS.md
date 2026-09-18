# 実装進捗メモ

最終更新: 2026-09-19

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.md、
日付ごとの記録はDEVLOG.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 0〜5（プロジェクト基盤〜ダッシュボードUI）がすべて完了。** Milestone 6（AI分析機能）に着手する段階。

---

## 完了したこと

### Milestone 0〜4：省略（DEVLOG.md参照）

### Milestone 5: ダッシュボードUI（すべて完了）
- ダッシュボードのメイン画面(`app/page.tsx`)：月選択・KPIカード・グラフ・補助分析を1画面にまとめて表示
- KPIカード（売上・粗利・リピート率、前月比・算出不可表示）
- 月次推移グラフ3種（Recharts、リピート率の算出不可を欠損表示）
- カテゴリ別売上棒グラフ、SKU別売上TOP10表、販売数量表示
- レスポンシブ対応：iPhone 12 Pro幅(390px)で崩れが無いことを確認済み
- ブラウザ確認：Chromeで一連の動作確認を実施済み

---

## 次にやること：Milestone 6（AI分析機能）

- [ ] `lib/ai/`にClaude APIクライアントを実装する（モデル：`claude-haiku-4-5`）
- [ ] Structured Outputsで出力スキーマ（summary / key_changes / top_contributors / notable_points / next_actions、数値フィールドなし）を定義する
- [ ] システムプロンプトを実装する（コンサルタントトーン、推測表現、比較データなし時の扱い）
- [ ] `GET /api/ai-report`を実装する（既存レコードがあれば返す、無ければ生成して保存、AI失敗時はエラー表示）
- [ ] ダッシュボードにAI分析結果を表示する
- [ ] AI連携ロジックの単体テスト

**Milestone 6に進む前に、Anthropic APIキーの取得が必要**（`.env.local`の`ANTHROPIC_API_KEY`が未設定。ユーザー側でAPIキーを取得してもらう必要がある）。

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key・APIキー等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- テストは`npm test`（Vitest）で実行。CIへの組み込みはMilestone 7で予定通り実施
- 開発サーバーはポートが3000/3001と変わることがある
- 現在DBに入っている実データ：2025年11月(15件、正式サンプルCSVより)、2025年12月(C999さんのダミー1件)
- `eslint.config.mjs`で`react-hooks/set-state-in-effect`ルールを無効化済み（理由はコメント参照）
