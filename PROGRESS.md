# 実装進捗メモ

最終更新: 2026-09-17

このファイルは「今どこまで進んでいて、次に何をするか」を記録するための作業メモです。
正式な仕様はREQUIREMENTSv2.md、設計はARCHITECTURE.md、作業リストはTASKS.md、
日付ごとの記録はDEVLOG.mdを参照してください。

---

## 今の状態（ひとことで）

**Milestone 0〜3（プロジェクト基盤・データベース・認証・CSVアップロード）がすべて完了。** Milestone 4（KPI集計API）に着手する段階。

---

## 完了したこと

### Milestone 0・1・2：省略（DEVLOG.md参照）

### Milestone 3: CSVアップロード機能（すべて完了）
- `csv-parse` / `zod` / `vitest` を導入
- `lib/csv/parse-sales-csv.ts`：CSV検証ロジック（UTF-8チェック・パース・8列チェック・型チェック・空データチェック・複数月混在チェック・返品負数許容）
- `lib/csv/parse-sales-csv.test.ts`：単体テスト10件（実際のサンプルCSVでのテスト含む、全件成功）
- `app/api/uploads/route.ts`：`POST /api/uploads`（ログイン確認→ファイル検証→`replace_monthly_sales`RPC呼び出し）
- `app/page.tsx`：アップロード画面（ログイン後のトップページ。ファイル選択・送信・結果表示）
- 依存関係の都合で`@types/node`を実際のNode.jsバージョン（v24）に合わせて更新

**動作確認済みの内容（ローカル環境でEnd-to-Endテスト）**：
- 単一月のCSV（サンプルCSVの11月分を抽出）をアップロード→「15件登録しました」と正しく表示
- データベース上でも、以前のダミーデータが新しい15件に正しく置き換わっていることを確認
- 複数月混在CSV（正式サンプルそのもの）をアップロード→「複数の月のデータが混在しています」という分かりやすいエラーメッセージが画面に表示されることを確認

---

## 次にやること：Milestone 4（KPI集計API）

- [ ] `lib/kpi/`にRPC呼び出しのラッパー関数を実装する
- [ ] `GET /api/months`を実装する
- [ ] `GET /api/kpi?month=YYYY-MM`を実装する（売上・粗利・リピート率・前月比較・カテゴリ別・SKU TOP10）
- [ ] `GET /api/kpi/trend?month=YYYY-MM&months=12`を実装する
- [ ] RPCラッパー関数の単体テスト

---

## 注意点・思い出しておくこと

- 進め方のルール：各タスクの前に「何を・なぜ・どこにつながるか・用語」を日本語で説明してから実装し、実装後は変更内容と確認結果を報告する
- GitHub・Supabase・Vercel・APIキーなど、外部サービスに関わる操作はAIが勝手に進めず、ユーザーへの手順案内という形で進める
- TASKS.md、ARCHITECTURE.md、REQUIREMENTSv2.mdに無い機能は追加しない
- 章番号の引用は「REQ」（REQUIREMENTSv2.md）「ARCH」（ARCHITECTURE.md）を付けて区別している
- 秘密情報（Secret key等）はチャットに貼らず、ユーザー自身がファイルへ直接入力する運用にしている
- Next.js 16では「middleware」が「Proxy」に名称変更されている（`proxy.ts`）
- テストは`npm test`（Vitest）で実行。CIへの組み込みはMilestone 7で予定通り実施
- `tmp-test-data/`はGit管理対象外の一時テストファイル置き場（単一月の動作確認用CSVなどを置く）
- 正式サンプルCSV（`case8-sales-sample.csv`）は9〜11月の3か月分が混在しており、そのままアップロードするとエラーになる仕様（意図通り）
