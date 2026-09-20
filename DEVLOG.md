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

## 2026-09-16

**Milestone 2（認証）完了**

- `@supabase/ssr`・`@supabase/supabase-js`を導入し、ブラウザ用・サーバー用・管理者権限用の3種類のSupabaseクライアントを実装
- ログイン画面（メール＋パスワード）を実装
- 未ログイン時にログイン画面へリダイレクトする仕組みを実装
  - Next.js 16では「middleware」が「Proxy」に名称変更されていることが判明し、公式の自動移行ツールで`proxy.ts`へ移行
- APIルート用のログイン確認共通処理（`requireUser`）を実装
- コードレビューで「ブラウザ側はSupabase Authのみ使用している」ことを確認
- Supabase Authに動作確認用アカウントを1つ作成し、`profiles`行も作成
- ローカル環境でログイン→トップページ表示までEnd-to-Endの動作確認に成功
  - 途中、Next.jsのデフォルトテンプレートに残っていたダークモード設定が原因で、ログイン画面の入力文字が見えなくなる不具合が発生 → 原因を特定し修正

## 2026-09-17

**Milestone 3（CSVアップロード機能）完了**

- `csv-parse`・`zod`・`vitest`を導入
  - Vitest導入時に`@types/node`のバージョン不整合（実際のNode.jsはv24だが型定義は^20のまま）が発覚 → 実バージョンに合わせて更新
- CSV検証ロジック（`parseSalesCsv`）を実装し、単体テスト10件を作成（全件成功）
  - REQUIREMENTSv2.mdの正式サンプルCSVが実際には9〜11月の3か月混在であることが判明。これを「複数月混在エラー」として正しく検出することもテストで確認
- `POST /api/uploads`を実装（ログイン確認→CSV検証→`replace_monthly_sales`RPC呼び出し）
- アップロード画面（ログイン後のトップページ）を実装
- ローカル環境でEnd-to-Endの動作確認に成功
  - サンプルCSVの11月分のみを抽出したテストファイルで正常アップロード → 15件登録、以前のダミーデータからの正しい置換を確認
  - 複数月混在のサンプルCSVをそのままアップロード → 分かりやすいエラーメッセージの表示を確認

**Milestone 4（KPI集計API）完了**

- `lib/kpi/calculations.ts`（リピート率・粗利率・前月計算）、`lib/kpi/rpc.ts`（5つのRPC呼び出しラッパー＋補助関数）を実装し、あわせて16件のテストを作成
- `GET /api/months`・`GET /api/kpi`・`GET /api/kpi/trend`を実装
- ローカル環境で実際にブラウザからAPIを呼び出し、CSVファイルの実際の合計値と完全に一致することを確認
- 動作確認中に一時的にログインできなくなる現象が発生したが、調査の結果は一過性のものと判明。調査の過程で、Proxy(旧middleware)のリダイレクト時に不要なクエリ文字列が残る小さな不具合を発見し修正
- 11月の実データアップロードにより、Milestone1のダミー客(C999)の購入履歴が変化し、月次推移APIが「算出不可」と「本当の0%」を正しく区別できることを改めて確認できた

## 2026-09-18〜19

**Milestone 5（ダッシュボードUI）着手、レスポンシブ・ブラウザ確認を残してほぼ完了**

- ダッシュボードのメイン画面(`app/page.tsx`)を実装。アップロードフォームを部品化し、月選択・KPIカード・グラフをまとめて表示する構成にした
- KPIカード(売上・粗利・リピート率、前月比・算出不可表示)を実装
- グラフ実装前にdatavizスキルを参照し、単一系列の折れ線・棒グラフの設計指針を確認(ブランドカラーのネイビーを使用、凡例なし)
- 月次推移グラフ3種(Recharts)、カテゴリ別売上棒グラフ、SKU別TOP10表、販売数量表示を実装
- ローカル環境で11月の実データ・12月のダミーデータ両方を使い、表示内容が正しいことを確認
- Next.js 16のデフォルトLintルール`react-hooks/set-state-in-effect`が、`useEffect`でのデータ取得という一般的なパターンを一律エラーにする問題に遭遇 → 調査の結果、このルールのみ無効化する判断をした(理由をコードにコメント)
- 細かい表示不具合(グラフのx軸ラベル省略、SKUランキング見出しの表記)を2件発見し修正
- レスポンシブ対応・ブラウザ動作確認の途中で休憩

**Milestone 5（ダッシュボードUI）完了**

- レスポンシブ対応を確認：iPhone 12 Pro幅(390px)でKPIカードが縦積みになり、グラフも横幅に収まって崩れないことを確認
- ブラウザ動作確認：Chromeで一連の動作確認をすでに実施済みであることを確認し完了とした
- Milestone 5の全タスクが完了

**Milestone 6（AI分析機能）着手・コード実装完了**

- Anthropic APIキーを取得し、`.env.local`に設定
- Claude API TypeScript SDKの使い方(`client.messages.parse` + `zodOutputFormat`によるStructured Outputs)をclaude-apiスキルで確認してから実装
- `/api/kpi`と`/api/ai-report`で共通のKPI組み立てロジックを`buildKpiResponse`としてリファクタリング
- AI入力データ変換ロジック(`comparison_available`の明示)、Claude APIクライアント(モデル：`claude-haiku-4-5`)、システムプロンプトを実装
- `GET /api/ai-report`を実装し、11月(比較データなし)・12月(比較データあり)の両方でAIの生成内容が正確であることを確認
  - 数値の捏造が無いこと、前月データが無い月では比較コメントをしないこと、深刻な変化には適切なヘッジ表現で言及することを確認
  - 再アクセス時に再生成されず保存済み結果が返ること(キャッシュ)を確認
- ダッシュボードへのAI分析結果表示(5セクション)を実装
- テストしやすいようClaude APIクライアントを依存性注入の形にリファクタリングし、モックを使った単体テストを追加
- Vercelへの`ANTHROPIC_API_KEY`設定を残して休憩

## 2026-09-20

**Milestone 6の残作業を完了、あわせて本番環境の設定不備を発見・修正**

- Vercelへ`ANTHROPIC_API_KEY`を追加
- その際、9月14日に設定したSupabase関連の環境変数が`NEXT_PUBLIC_`接頭辞の無い誤った名前
  (`SUPABASE_URL`等)のまま本番環境に残っていたことを発見
  - Vercelの自動連携(Integration)が原因ではないことを確認
  - 正しい名前・正しいType(公開用はConfig、秘密情報はSecret)で登録し直し、再デプロイ
  - 本番環境で実際にログインできることを確認し、Milestone 6を完全に完了とした
