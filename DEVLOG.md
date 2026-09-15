# 開発記録

日付ごとに「その日やったこと」を記録していくログです。
現在の状態のまとめは`PROGRESS.md`、正式な仕様・設計は`REQUIREMENTSv2.md`・`ARCHITECTURE.md`・`TASKS.md`を参照してください。

---

## 2026-09-09

- `REQUIREMENTS.md`（要件定義書 初版）をレビュー
- 要件間の矛盾、不足している業務要件、曖昧な定義、受け入れ条件として検証困難な箇所を洗い出した

## 2026-09-10

- 修正版`REQUIREMENTSv2.md`をレビュー
- 前回指摘した問題が解消されているかを確認し、新たに見つかった課題を「重大」「改善提案」に分けて指摘

## 2026-09-11

- `REQUIREMENTSv2.md`に残っていた重大な矛盾（4点）が解消されたことを確認
- `ARCHITECTURE.md`（設計書）を新規作成
  - 技術スタック：Next.js + TypeScript + Tailwind CSS、PostgreSQL(Supabase)、Supabase Auth、Vercel、Claude API（`claude-haiku-4-5`）
- `ARCHITECTURE.md`のレビューを実施し、実装に進む前に3つの重大な問題を修正
  - CSVアップロード時のデータベース処理の順序が誤っていた（外部キー制約違反になるバグ）
  - 複雑なKPI集計をSupabaseクライアントで直接実行できない設計になっていた → PostgreSQL関数 + Supabase RPC方式に変更
  - 月次推移（売上・粗利・リピート率の推移グラフ）を計算する仕組みが設計から抜けていた
- `TASKS.md`（作業リスト）を新規作成し、Milestone 0〜9に整理
- `TASKS.md`のレビューを行い、章番号の参照元の明確化・CI構築の前倒し・AI保存項目の明記・ブラウザ動作確認タスクの追加を反映
- 3ファイル（要件・設計・タスク）の整合性を最終確認し、実装開始OKと判断

## 2026-09-12

**Milestone 0（プロジェクト基盤）に着手**

- Next.js（App Router）+ TypeScript + Tailwind CSSでプロジェクトを初期化（npm使用）
- Tailwind CSSにネイビー色（`#1a2e5c`）を`navy`として登録し、仮のトップページで表示確認
- GitHubリポジトリを作成し、初回コミット・プッシュ（`https://github.com/toranana2162-web/ai-sales-dashboard`）
  - Gitのコミット名義が未設定だったため、このリポジトリ専用に設定

## 2026-09-13

- GitHub Actionsによる基本CI（`.github/workflows/pr-check.yml`：型チェック・Lint・ビルド確認）を構築
- mainブランチの保護ルール（PRを必須にする）を設定

## 2026-09-14

**Milestone 0（プロジェクト基盤）完了 → Milestone 1（データベース・RPC関数）に着手**

- Supabaseプロジェクトを作成
- 接続情報（URL・Publishable key・Secret key）を取得し、`.env.local`に設定
  - `NEXT_PUBLIC_`接頭辞の必要性に気づき、変数名を修正（`NEXT_PUBLIC_SUPABASE_URL`等）
  - `.env.example`（見本ファイル）も作成
- Vercelプロジェクトを作成し、GitHubと連携・初回デプロイ
  - 練習プロジェクトのため、有料のProプランではなく無料のHobbyプランを採用することを決定し、`ARCHITECTURE.md`に反映
- 4つのテーブル（`profiles` / `monthly_uploads` / `sales_transactions` / `ai_reports`）を作成
  - SupabaseがRLS（行レベルセキュリティ）未設定の警告を検出 → 全テーブルでRLSを有効化（サーバー側のservice_role keyのみアクセス可能な設計に）
  - 作業中にSupabaseダッシュボードが一時的にクラッシュするトラブルがあったが、データベースには影響なしと確認
- RPC関数`replace_monthly_sales`（CSVアップロード時の登録・置換処理）を実装

## 2026-09-15

**Milestone 1（データベース・RPC関数）完了**

- `replace_monthly_sales`をダミーデータでテスト
  - 新規の月の初回登録（以前見つけたバグの修正確認）
  - 同じ月への再アップロードによるデータ置換
- RPC関数`get_monthly_summary`（売上・粗利・リピート判定用の顧客数）を実装し、リピート判定ロジックまで含めて動作確認
- RPC関数`get_category_breakdown`（カテゴリ別売上）を実装・動作確認
- RPC関数`get_sku_ranking`（SKU別売上TOP N）を実装・動作確認
- RPC関数`get_monthly_trend`（複数月の売上・粗利・リピート率の推移）を実装
  - リピート率が「算出不可（NULL）」になるケースも含めて動作確認
- Milestone 1の全タスク完了。休憩を挟み、開発記録（このファイル）を新規作成
