# AI搭載 売上分析ダッシュボード タスクリスト

対応要件定義書: REQUIREMENTSv2.md（以下 REQ）
対応設計書: ARCHITECTURE.md（以下 ARCH）

## 進め方

- マイルストーン0→9の順に、依存関係を崩さず上から着手する（後段のマイルストーンは前段のRPC関数・APIを前提にしている）
- 各タスクの完了条件は、対応するREQ／ARCHの章番号を満たすこと
- マイルストーン単位でPRを分け、ARCH 11章のCIチェック（型チェック・Lint・テスト・ビルド）を通してからマージする
- Phase 2候補（担当営業別分析・在庫回転率・日次/週次分析・他モール連携等）はこのタスクリストに含めない（REQ 24章）

---

## Milestone 0: プロジェクト基盤

- [x] Next.js（App Router）+ TypeScriptプロジェクトを初期化する
- [x] Tailwind CSSを導入し、基本カラー（白／ネイビー `#1A2E5C`）をテーマ設定する（REQ 18章）
- [x] GitHubリポジトリを作成する
- [x] `.github/workflows/pr-check.yml`を作成し、型チェック・Lint・ビルド確認を実行する基本CIパイプラインを構築する（ARCH 11.1章）
- [x] mainブランチに保護ルール（上記CIチェック必須）を設定する
- [x] Supabaseプロジェクトを作成する
- [x] Vercelプロジェクトを作成し、GitHubリポジトリと連携する（ARCH 11.2章）
- [x] 環境変数を整理する：`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `ANTHROPIC_API_KEY`（ローカルは`.env.local`、本番はVercelのSecretsに設定。REQ 20.1章。`ANTHROPIC_API_KEY`はMilestone 6で取得次第、同じ手順で追加する）

---

## Milestone 1: データベース（テーブル・RPC関数）

ARCH 4章・6章の設計をそのままマイグレーションとして実装する。

- [x] `supabase/migrations/`にテーブル定義を作成する：`profiles` / `monthly_uploads`（`status`列含む）/ `sales_transactions` / `ai_reports`（RLS有効化も実施済み）
- [x] `sales_transactions`に外部キー制約（`target_month` -> `monthly_uploads.target_month`）とインデックス（`target_month`, `customer_id`, `order_date`）を設定する
- [x] RPC関数`replace_monthly_sales`を実装する（ARCH 4.2章のSQL通り。UPSERT→削除→挿入→完了更新→ai_reports無効化を1関数に集約）
- [x] RPC関数`get_monthly_summary`を実装する（ARCH 6.1章）
- [x] RPC関数`get_category_breakdown`を実装する（ARCH 6.3章）
- [x] RPC関数`get_sku_ranking`を実装する（ARCH 6.4章）
- [x] RPC関数`get_monthly_trend`を実装する（ARCH 6.5章）
- [x] ローカル/テスト環境でマイグレーションを流し、`replace_monthly_sales`をダミーデータで手動実行して一連の状態遷移（pending→completed、再アップロード時の置換）を確認する（あわせて全RPC関数の動作もダミーデータで確認済み）

---

## Milestone 2: 認証

- [x] Supabase Authを有効化し、Next.js（App Router）用のSupabase SSRクライアントを実装する
- [x] ログイン画面（メール＋パスワード）を実装する
- [x] Proxy（`proxy.ts`。旧称:middleware）で未認証アクセスをログイン画面へリダイレクトする（ARCH 8章）
- [x] 全APIルートでセッション検証を行う共通処理を実装する（ARCH 12章・REQ 20.3章。実際の適用はMilestone 3以降の各APIルートで行う）
- [x] ブラウザから直接呼び出すSupabase処理をAuth関連のみに限定し、データ系のRPC・テーブルアクセスはNext.js APIルート経由のみで行われることをコードレビューで確認する（ARCH 8章）
- [x] 利用者アカウントをSupabaseダッシュボードで作成し、対応する`profiles`行を作成する（REQ 27章：セルフサインアップは実装しない）。現時点では動作確認用に管理者1名分のみ作成。残り6名分は実際の公開が近づいた段階で追加予定

---

## Milestone 3: CSVアップロード機能

- [x] アップロードUI（ファイル選択・送信）を実装する
- [x] `POST /api/uploads`を実装する
  - [x] ファイル形式チェック（CSVであること）
  - [x] UTF-8としてデコードできることの確認（デコード失敗時はエラーを返す。REQ 8.2章）
  - [x] csv-parseでのパース
  - [x] Zodスキーマで8列の存在・型を検証する（`order_date`は有効な日付、`quantity`/`revenue`/`cost`は有効な数値。返品による負数も許容する。REQ 7.3章・REQ 8.1章）
  - [x] データが1件以上存在することを確認する（REQ 8.1章）
  - [x] 全行の`order_date`から対象月を自動判定し、複数月にまたがる場合はエラーとする（REQ 27章）
  - [x] 検証済み行データをJSONBに整形し、`replace_monthly_sales`をRPC呼び出しする
- [x] 検証エラー時に、原因が分かるエラーメッセージを画面に表示する（REQ 8.1章）
- [x] アップロード成功時に対象月・登録件数を画面に表示する
- [x] CSV検証ロジックの単体テストを実装する（8列チェック・空データ・複数月混在・負数許容等。実際のサンプルCSVでのテストも含む）

---

## Milestone 4: KPI集計API

- [x] `lib/kpi/`にRPC呼び出しのラッパー関数を実装する
- [x] `GET /api/months`を実装する（データが存在する対象月一覧）
- [x] `GET /api/kpi?month=YYYY-MM`を実装する
  - [x] `get_monthly_summary` / `get_category_breakdown` / `get_sku_ranking`を呼び出す
  - [x] 前月分の`get_monthly_summary`を呼び出し、前月データが無ければ「比較データなし」を返す（REQ 11章）
  - [x] `unique_customers = 0`、または対象月より前のデータが存在しない場合にリピート率を「算出不可」として返す（REQ 10.4章）
  - [x] 粗利率（粗利÷売上×100）をアプリ層で算出し補助情報として返す（REQ 10.3章）
- [x] `GET /api/kpi/trend?month=YYYY-MM&months=12`を実装する（`get_monthly_trend`を呼び出し、`repeat_rate`が`NULL`の月を「算出不可」として返す）
- [x] RPCラッパー関数の単体テスト（RPC呼び出しをモック）を実装する

---

## Milestone 5: ダッシュボードUI

- [x] 対象月選択UIを実装する（`/api/months`から取得。REQ 14.3章）
- [x] 最重要KPIカード（売上・粗利・リピート率、前月比）を画面上部に表示する（REQ 10.1章・REQ 14.1章）
- [x] 月次売上推移・月次粗利推移・リピート率推移グラフを実装する（Recharts、REQ 14.2章）
  - [x] リピート率推移で「算出不可」の月を欠損として明示する
- [x] カテゴリ別売上グラフを実装する（REQ 12.1章）
- [x] SKU別売上TOP10テーブル/グラフを実装する（10未満の場合は存在する分のみ表示。REQ 12.2章）
- [x] 販売数量表示を実装する（REQ 12.3章）
- [x] レスポンシブ対応を確認する（PC主体、主要画面はスマートフォンでも大きく崩れないこと。REQ 19章）
- [x] 主要な最新版Chromium系ブラウザ（Chrome／Edge等）で主要操作が問題なく動作することを確認する（REQ 19章。Chromeでここまでの全動作確認を実施済み）

---

## Milestone 6: AI分析機能

- [x] `lib/ai/`にClaude APIクライアントを実装する（モデル：`claude-haiku-4-5`）
- [x] Structured Outputsで出力スキーマ（summary / key_changes / top_contributors / notable_points / next_actions、数値フィールドなし）を定義する（ARCH 7.1章）
- [x] システムプロンプトを実装する（コンサルタントトーン、推測表現の使用、渡された数値以外を生成しない指示、比較データなし時の扱い。ARCH 7.3章）
- [x] `GET /api/ai-report?month=YYYY-MM`を実装する
  - [x] `ai_reports`に既存レコードがあればそれを返す
  - [x] 無ければ`/api/kpi`相当のデータを整形してAIへ渡し、生成結果を`ai_reports`へ保存してから返す（AIへ渡した構造化データは`input_payload`列に保存する。前月データが無い指標は`comparison_available: false`として明示する。ARCH 7.2章・ARCH 4.1章）
  - [x] AI API呼び出し失敗時はAI分析欄にのみエラーメッセージを表示し、KPI表示には影響させない（ARCH 7.5章）
- [x] ダッシュボードにAI分析結果（5セクション）を表示する
- [x] AI連携ロジックの単体テスト（Claude APIクライアントをモック）を実装する

---

## Milestone 7: CI/CD

- [x] Milestone0で構築した基本CIパイプライン（`pr-check.yml`）へ、テスト実行ステップを追加する（Milestone3・4・6で追加した単体テストを実行。ARCH 11.1章）
- [ ] Vercelとの自動デプロイ連携を確認する（mainマージ後に本番反映されること。ARCH 11.2章）
- [x] mainブランチ保護ルール（CIチェック必須）を最終確認する

---

## Milestone 8: セキュリティ・非機能要件の確認

- [x] APIキー・service role keyがソースコードに含まれていないことを確認する（REQ 20.1章。コード・Git履歴の両方を検索し、`.env.local`も一度もコミットされていないことを確認済み）
- [x] 本番環境（Vercel）がHTTPSで提供されていることを確認する（REQ 20.2章。HTTP→HTTPSへの自動リダイレクトも確認済み）
- [x] `customer_id`以外の直接的個人情報を保存していないことを確認する（REQ 20.4章。`sales_transactions`テーブル・CSV検証ロジックともに氏名・住所・電話番号・メールアドレス等の列は無いことを確認済み）
- [x] 想定データ量（月間最大1万行）のCSVで、アップロードから集計・表示までが10秒以内に完了することを確認する（REQ 21章。実測：アップロード1.5秒＋KPI表示0.5秒＋推移表示0.4秒＝合計約2.4秒。AI分析の9.8秒はREQ21章で対象外と明記されているため計測対象外）
- [x] Supabase Free tierの自動一時停止の挙動を実運用に近い形で確認する（ARCH 3.2章・ARCH 15章。7日間放置しての実発生確認は現実的でないため、公式仕様（7日間アクセスなしで自動停止・データは保持・Restartボタンで数分後に復旧）と、ダッシュボード上に実際にRestart/Pauseボタンが存在し機能する状態であることを確認。運用上の注意としてPROGRESS.mdに記録）

---

## Milestone 9: 受け入れテスト

REQ 25章の受入条件22項目を1件ずつ確認する。

- [ ] #1-2 正式フォーマットのCSVアップロード・検証エラー表示
- [ ] #3-4 DB保存・再アップロード時の置換
- [ ] #5-7 売上・粗利・リピート率の算出
- [ ] #8-10 前月比較・比較データなし表示・算出不可表示
- [ ] #11-15 カテゴリ別・SKU TOP10・販売数量・月次推移の表示
- [ ] #16-17 AIサマリー・次月アクション提案の生成
- [ ] #18 表示KPI数値がアプリケーション計算結果と一致すること
- [ ] #19-20 初期表示でのKPI確認・PCブラウザでの動作
- [ ] #21 月額運用費の想定見積りが5,000円以内であること
- [ ] #22 手作業での再集計・グラフ作成が不要であること
- [ ] REQ 26章の業務効率化評価（CSVアップロード〜AI分析確認までの所要時間）を試験的に計測する
