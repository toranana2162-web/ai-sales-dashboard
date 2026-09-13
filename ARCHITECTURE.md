# AI搭載 売上分析ダッシュボード アーキテクチャ設計書

Version: 1.0
対応要件定義書: REQUIREMENTSv2.md（27章の模擬案件前提を含む）

---

# 1. 設計方針

REQUIREMENTSv2.mdの制約条件を技術選定の前提とする。

- 初期開発予算 45万円以内、月額運用予算 5,000円以内（22章）
- 利用者7名、月1回のCSVアップロード、月1回のAI分析生成（27章前提）
- 過去データはDBへ蓄積し、リピート率・前月比較を可能にする（6章）
- KPIの数値はアプリケーション側で計算し、AIには文章生成のみを担当させる（15章・16章）
- 小規模・低頻度アクセスのため、運用の手間とコストを最小化する構成を優先する

この方針に基づき、**枯れた技術・マネージドサービス中心の構成**を採用し、自前でのサーバー運用・スケーリング設計を避ける。

---

# 2. 技術スタック

| 領域 | 選定 | 理由 |
|---|---|---|
| フロントエンド/バックエンド | Next.js 14 (App Router) + TypeScript | フロント・API・SSRを1つのコードベースで完結でき、45万円予算内での開発工数を抑えられる |
| UIスタイリング | Tailwind CSS | 白＋ネイビーの配色（18章）やKPI重視のレイアウトを高速に実装できる |
| グラフ | Recharts | Reactとの親和性が高く、月次推移・カテゴリ別・ランキング表示に必要な種類を軽量にカバーできる |
| CSVパース | csv-parse | Node/サーバーレス環境での型変換・ストリーミング処理に適した実績あるライブラリ |
| バリデーション | Zod | CSV行データ・APIリクエスト・AI構造化出力のスキーマを型安全に検証できる |
| データベース | PostgreSQL（Supabase） | 行単位データの保存・集計クエリ（SUM, GROUP BY, EXISTS判定）に適したリレーショナルDB |
| DBアクセス方式 | 通常のCRUD・認証：`@supabase/supabase-js` ／ 複雑な集計：PostgreSQL関数＋Supabase RPC | WITH句・EXISTS・FILTERを使う集計や複数テーブルにまたがる書き込みをSQL関数に閉じ込め、1回のRPC呼び出しでアトミックに実行する |
| 認証 | Supabase Auth（メール＋パスワード） | 管理者による手動アカウント発行（27章）をダッシュボード操作またはAdmin APIで実現でき、セルフサインアップ機能を作り込む必要がない |
| ホスティング | Vercel（Pro プラン） | Next.jsとの統合が最も安定しており、商用利用可能。GitHub連携でmainマージ後の自動デプロイを標準機能として実現できる |
| AI API | Anthropic Claude API（`claude-haiku-4-5`） | 構造化データを渡してレポート文章を生成する低頻度バッチ用途に対し、十分な文章品質を最も低コストで提供できるモデル |
| CI | GitHub Actions | 要件23章の指定通り |

---

# 3. コスト試算

## 3.1 初期開発（45万円以内）

技術選定はいずれも学習コストの低い標準的な構成であり、追加のインフラ構築コスト（サーバー構築・DB運用設計等）が発生しないため、開発工数を機能実装に集中できる。

## 3.2 月額運用（5,000円以内）

| 項目 | サービス | 月額目安 |
|---|---|---|
| ホスティング | Vercel Pro（商用利用時の目標構成） | 約20ドル |
| データベース／認証 | Supabase Free tier | 0ドル |
| AI API | Claude API（`claude-haiku-4-5`、月1回生成、入力$1/1M・出力$5/1Mトークン） | 1円〜数十円程度（1回あたり数千トークン規模のため） |

Vercel Proの費用がドル建てのため為替により変動するが、現在のレートを前提とすると合計は月額5,000円以内に十分収まり、余裕（バッファ）がある。

**開発・練習段階での運用**：本案件は27章の通り模擬案件であり、現時点では実際の商用公開を行わないため、開発中はVercelの無料プラン（Hobby）を使用する。Hobbyプランは個人・非商用利用限定という利用規約上の制約があるため、実際にクライアントへ納品・商用公開する段階になった時点でPro（有料）プランへ切り替える。DBスキーマ・API設計・RPC構成など、本ドキュメントの他の設計内容には影響しない。

**運用上の注意（Supabase Free tierのリスク）**：Supabase Free tierは7日間アクセスが無ければプロジェクトが自動的に一時停止する仕様がある。本システムは月1回以上のアクセス（アップロード・閲覧）が想定されるため通常は問題にならないが、長期間利用が無い場合は手動での再開操作が必要になる可能性がある。頻繁に停止が発生する場合はSupabase Pro（月25ドル）への切替を検討する（この場合は月額予算超過となるため要再検討）。

---

# 4. データベース設計

## 4.1 テーブル一覧

### `profiles`（利用者プロフィール）
| カラム | 型 | 説明 |
|---|---|---|
| id | uuid (PK, FK -> auth.users.id) | Supabase Authのユーザーと1:1 |
| display_name | text | 表示名 |
| created_at | timestamptz | 作成日時 |

ロール・権限カラムは持たない（3.3章：Phase 1では役職別権限制御を行わない）。

### `monthly_uploads`（月次アップロード管理）
| カラム | 型 | 説明 |
|---|---|---|
| target_month | date (PK) | 対象月（各月1日で正規化。例: 2025-11-01） |
| uploaded_by | uuid (FK -> profiles.id) | 最後にアップロードした利用者 |
| uploaded_at | timestamptz | 最終アップロード日時 |
| original_filename | text | 元ファイル名 |
| row_count | integer | 登録行数（処理完了時に確定） |
| status | text | `pending`（登録処理中）／`completed`（登録完了） |

再アップロード時はこの行を上書き更新する（9章：月単位で置換）。`status`は4.2章のRPC関数内で`pending`→`completed`と遷移し、途中で処理が失敗した場合はPostgresの自動ロールバックにより変更自体が残らない。

### `sales_transactions`（取引明細）
| カラム | 型 | 説明 |
|---|---|---|
| id | bigserial (PK) | |
| target_month | date (FK -> monthly_uploads.target_month) | |
| order_date | date | |
| customer_id | text, nullable | 空の場合あり（8.3章） |
| product_name | text | |
| category | text | |
| sku | text | |
| quantity | numeric | |
| revenue | numeric | 行全体の売上金額（7.1章） |
| cost | numeric | 行単位の合計原価（7.1章） |
| created_at | timestamptz | |

インデックス：`(target_month)`、`(customer_id)`、`(order_date)`（リピート率判定・月次集計で使用）。

集計値（売上・粗利等）を保持する専用テーブルは作らない。Phase 1の想定データ量（月間最大1万行、21章）ではSQLによるオンザフライ集計で十分パフォーマンス要件（10秒以内）を満たせるため、生データとの不整合が生じるキャッシュ層を持たない設計とする。

### `ai_reports`（AI分析結果）
| カラム | 型 | 説明 |
|---|---|---|
| target_month | date (PK, FK -> monthly_uploads.target_month) | 対象月ごとに1件（17章：初回1回生成し再利用） |
| generated_at | timestamptz | |
| model_used | text | 使用モデル名を記録（トレーサビリティ用） |
| input_payload | jsonb | AIへ渡した構造化データのスナップショット（監査・再現用） |
| summary | text | 当月サマリー |
| key_changes | text | 前月から大きく変化した点 |
| top_contributors | text | 売上寄与の大きいカテゴリ・SKU |
| notable_points | text | 注目すべきポイント |
| next_actions | text | 次月のアクション提案 |

**設計上の重要な決定**：`ai_reports`にKPIの数値カラムは一切持たない。ダッシュボードに表示する売上・粗利・リピート率等の数値は、常に`sales_transactions`からのSQL集計結果を直接表示し、AIの生成文からは数値を抽出・表示しない。これにより16章の「表示する主要KPI数値はアプリケーション計算値を使用する」という要件を、構造（スキーマ）のレベルで担保する。

## 4.2 アップロード時のデータ反映（トランザクション設計）

初回アップロード・再アップロードいずれの場合も同じ処理を行う。CSVの検証（Zod）はNext.js側で完了させ、検証済みの行データのみをPostgreSQL関数`replace_monthly_sales`へJSONBとして渡し、DB側で以下をひとつの関数呼び出し（＝ひとつのトランザクション）として実行する。

1. `monthly_uploads`をUPSERTし、`status = 'pending'`で親行を確保する（対象月が新規でも、この時点で外部キー制約を満たした状態にする）
2. 対象月の既存`sales_transactions`を削除する
3. 新しい`sales_transactions`を挿入する
4. `monthly_uploads`を実際の登録件数とともに`status = 'completed'`へ更新する
5. `ai_reports`の該当`target_month`の行を削除する

5.は要件定義書に明記が無いため、本設計で以下の方針を定める：**データが訂正された場合、既存のAIレポートはその月のデータを正しく反映していない可能性があるため無効化し、次回そのダッシュボードにアクセスした際に再生成する。** これは「AI再生成機能は実装しない」（27章）という制約とは独立した挙動であり、ユーザー操作による再生成ではなくデータ整合性を保つためのシステム内部処理として扱う。

### RPC関数（サーバー側SQL関数）のイメージ

```sql
CREATE OR REPLACE FUNCTION replace_monthly_sales(
  p_target_month date,
  p_uploaded_by uuid,
  p_original_filename text,
  p_rows jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO monthly_uploads (target_month, uploaded_by, uploaded_at, original_filename, row_count, status)
  VALUES (p_target_month, p_uploaded_by, now(), p_original_filename, 0, 'pending')
  ON CONFLICT (target_month) DO UPDATE
    SET uploaded_by = EXCLUDED.uploaded_by,
        uploaded_at = EXCLUDED.uploaded_at,
        original_filename = EXCLUDED.original_filename,
        status = 'pending';

  DELETE FROM sales_transactions WHERE target_month = p_target_month;

  INSERT INTO sales_transactions
    (target_month, order_date, customer_id, product_name, category, sku, quantity, revenue, cost)
  SELECT
    p_target_month, x.order_date, x.customer_id, x.product_name, x.category, x.sku, x.quantity, x.revenue, x.cost
  FROM jsonb_to_recordset(p_rows) AS x(
    order_date date, customer_id text, product_name text, category text,
    sku text, quantity numeric, revenue numeric, cost numeric
  );

  UPDATE monthly_uploads
    SET row_count = (SELECT count(*) FROM sales_transactions WHERE target_month = p_target_month),
        status = 'completed'
    WHERE target_month = p_target_month;

  DELETE FROM ai_reports WHERE target_month = p_target_month;
END;
$$ LANGUAGE plpgsql;
```

`replace_monthly_sales`は1回のPL/pgSQL関数呼び出しとして実行されるため、途中のいずれかの文（型変換エラー等）で例外が発生した場合、Postgresが呼び出し全体を自動的にロールバックする。これにより「親行だけ作られて明細が入らない」「古いデータが消えたのに新しいデータが入らない」といった不整合が残らない。Next.js側は`supabase.rpc('replace_monthly_sales', { p_target_month, p_uploaded_by, p_original_filename, p_rows })`の1回の呼び出しで完結させる。

---

# 5. アプリケーション処理フロー

```
[ユーザー]
  |  CSVファイルを選択してアップロード
  v
[POST /api/uploads]
  1. ファイル形式チェック（CSVであること・UTF-8としてデコード可能であること。デコード失敗時は原因を示すエラーを返す）
  2. csv-parseでパース
  3. Zodスキーマで各行を検証（8列存在・型チェック）
     - order_date: 有効な日付
     - quantity / revenue / cost: 有効な数値（返品等を反映した負数も許容する。7.3章）
  4. データが1件以上存在することを確認する（0件の場合はエラー）
  5. 全行のorder_dateから対象月を判定
     - 月が複数にまたがる場合はエラーを返す（27章前提）
  6. バリデーション結果に問題があれば、原因を含むエラーを返し処理中断
  7. 検証済みの行データをJSONBとして`replace_monthly_sales`をSupabase RPC経由で呼び出す
     （関数内でmonthly_uploadsのUPSERT → sales_transactions置換 → monthly_uploads完了更新 → ai_reports無効化を1トランザクションとして実行。詳細は4.2章）
  8. 完了レスポンス（対象月・登録件数）を返す
  v
[ダッシュボード画面]
  - GET /api/months で選択可能な対象月一覧を取得
  - 対象月選択（14.3章）
  - GET /api/kpi?month=YYYY-MM でKPI・グラフデータを取得（RPC集計、都度計算）
  - GET /api/kpi/trend?month=YYYY-MM で月次推移（売上・粗利・リピート率）を取得
  - GET /api/ai-report?month=YYYY-MM でAI分析結果を取得
    - ai_reportsに存在すればそれを返す
    - 存在しなければClaude APIを呼び出して生成し、保存してから返す
    - Claude API呼び出しが失敗した場合はAI分析欄にのみエラー表示し、KPI表示は継続する（7.5章）
```

---

# 6. KPI集計ロジック

WITH句・EXISTS・FILTERを用いる集計はすべてPostgreSQL関数として実装し、Next.js側からは`supabase.rpc(...)`経由で呼び出す（アプリケーション側のコード内でのループ集計は行わない）。`@supabase/supabase-js`の通常のクエリビルダーはこれらの複雑な集計をそのままでは表現できないため、この方式に統一する。

## 6.1 単月サマリー（売上・粗利・リピート判定用の顧客数・数量）

```sql
CREATE OR REPLACE FUNCTION get_monthly_summary(p_target_month date)
RETURNS TABLE (
  revenue numeric,
  gross_profit numeric,
  unique_customers integer,
  repeat_customers integer,
  total_quantity numeric
) AS $$
  SELECT
    COALESCE(SUM(st.revenue), 0),
    COALESCE(SUM(st.revenue - st.cost), 0),
    COUNT(DISTINCT st.customer_id) FILTER (WHERE st.customer_id IS NOT NULL),
    COUNT(DISTINCT st.customer_id) FILTER (
      WHERE st.customer_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM sales_transactions prior
          WHERE prior.customer_id = st.customer_id
            AND prior.order_date < p_target_month
        )
    ),
    COALESCE(SUM(st.quantity), 0)
  FROM sales_transactions st
  WHERE st.target_month = p_target_month;
$$ LANGUAGE sql STABLE;
```

呼び出し側（Next.jsのAPIルート）で以下を行う。
- `unique_customers = 0`の場合、リピート率は「算出不可」として扱う（10.4章）
- 対象月より前のデータが1件も存在しない場合（6.3章：初回導入時）も「算出不可」として扱う。6.5節の`get_monthly_trend`の判定ロジックと同じ考え方を単月にも適用する
- リピート率 = `repeat_customers / unique_customers * 100`

## 6.2 前月比較
`target_month`から暦月で1つ前の月（11章）について同じ`get_monthly_summary`を呼び出し、`monthly_uploads`にその月のデータが存在しなければ「比較データなし」を返す。存在する場合はアプリケーション層で差分・比率を計算する。

## 6.3 カテゴリ別分析

```sql
CREATE OR REPLACE FUNCTION get_category_breakdown(p_target_month date)
RETURNS TABLE (category text, revenue numeric) AS $$
  SELECT category, SUM(revenue)
  FROM sales_transactions
  WHERE target_month = p_target_month
  GROUP BY category
  ORDER BY SUM(revenue) DESC;
$$ LANGUAGE sql STABLE;
```

## 6.4 SKU別売上TOP10

```sql
CREATE OR REPLACE FUNCTION get_sku_ranking(p_target_month date, p_limit int DEFAULT 10)
RETURNS TABLE (sku text, product_name text, revenue numeric) AS $$
  SELECT sku, MAX(product_name), SUM(revenue)
  FROM sales_transactions
  WHERE target_month = p_target_month
  GROUP BY sku
  ORDER BY SUM(revenue) DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;
```

販売数量の合計は6.1の`get_monthly_summary`の`total_quantity`をそのまま用いる（12.3章）。

## 6.5 月次推移（売上・粗利・リピート率）

14.2章「月次売上推移」「月次粗利推移」「リピート率推移」、および25章受入条件#15に対応する。単月集計とは別に、複数月分をまとめて1回のRPC呼び出しで返す関数を用意する。売上・粗利は月単位のSUM、リピート率は各対象月について「その月の購入顧客が、その月より前にも購入履歴を持つか」をEXISTSで判定して算出する。

```sql
CREATE OR REPLACE FUNCTION get_monthly_trend(p_target_month date, p_months int DEFAULT 12)
RETURNS TABLE (
  target_month date,
  revenue numeric,
  gross_profit numeric,
  unique_customers integer,
  repeat_customers integer,
  repeat_rate numeric
) AS $$
  SELECT
    mu.target_month,
    COALESCE(SUM(st.revenue), 0),
    COALESCE(SUM(st.revenue - st.cost), 0),
    COUNT(DISTINCT st.customer_id) FILTER (WHERE st.customer_id IS NOT NULL),
    COUNT(DISTINCT st.customer_id) FILTER (
      WHERE st.customer_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM sales_transactions prior
          WHERE prior.customer_id = st.customer_id
            AND prior.order_date < mu.target_month
        )
    ),
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM sales_transactions e WHERE e.order_date < mu.target_month) THEN NULL
      WHEN COUNT(DISTINCT st.customer_id) FILTER (WHERE st.customer_id IS NOT NULL) = 0 THEN NULL
      ELSE ROUND(
        COUNT(DISTINCT st.customer_id) FILTER (
          WHERE st.customer_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM sales_transactions prior
              WHERE prior.customer_id = st.customer_id
                AND prior.order_date < mu.target_month
            )
        )::numeric
        / NULLIF(COUNT(DISTINCT st.customer_id) FILTER (WHERE st.customer_id IS NOT NULL), 0) * 100
      , 1)
    END
  FROM monthly_uploads mu
  LEFT JOIN sales_transactions st ON st.target_month = mu.target_month
  WHERE mu.target_month BETWEEN (p_target_month - (p_months - 1) * INTERVAL '1 month')::date AND p_target_month
  GROUP BY mu.target_month
  ORDER BY mu.target_month;
$$ LANGUAGE sql STABLE;
```

- `monthly_uploads`に実際にデータが存在する月のみを対象とし、未アップロードの月を0埋めで補完することはしない
- `repeat_rate`が`NULL`の月（対象月より前のデータが1件も存在しない月）は、ダッシュボード上で「算出不可」として明示する（10.4章・6.3章と整合させる）

### 役割分担
- **RPC（Postgres関数）**：SUM・GROUP BY・EXISTS等の集計そのもの
- **Next.js APIルート（`/api/kpi`, `/api/kpi/trend`）**：RPCの呼び出し、前月比較の差分計算、`unique_customers = 0`等に基づく「算出不可」「比較データなし」の最終判定、フロントエンド向けレスポンス整形

---

# 7. AI連携設計

## 7.1 モデル・APIパラメータ

- モデル：`claude-haiku-4-5`
- 用途：構造化データ（JSON）を入力として渡し、5種類のテキストセクションを生成する低頻度バッチ処理
- Structured Outputs（`output_config.format`）を使用し、出力スキーマを次のように限定する：

```json
{
  "summary": "string",
  "key_changes": "string",
  "top_contributors": "string",
  "notable_points": "string",
  "next_actions": "string"
}
```

出力スキーマに数値型フィールドを含めないことで、AIの出力から数値をそのままダッシュボードの正式なKPIとして採用する経路自体を無くす（16章要件のAPIレベルでの担保）。

## 7.2 AIへ渡すデータ（15.2章準拠）

```json
{
  "target_month": "2025-11",
  "revenue": { "current": 1234567, "previous": 1100000, "change_rate": 0.122 },
  "gross_profit": { "current": 456789, "previous": 400000, "change_rate": 0.142 },
  "repeat_rate": { "current": 0.35, "previous": 0.30, "change_rate": 0.05 },
  "category_breakdown": [{ "category": "トップス", "revenue": 500000 }],
  "sku_ranking_top10": [{ "sku": "SKU001", "product_name": "...", "revenue": 300000 }],
  "quantity": { "current": 1200 }
}
```

前月データが存在しない項目は、値をnullにするのではなく`"previous": null, "comparison_available": false`のように明示し、システムプロンプトで「comparison_available が false の指標については前月比較のコメントを生成しない」ことを指示する（27章前提「比較データなしをAIへ明示する」に対応）。

## 7.3 プロンプト設計方針

- システムプロンプトに以下を明記する
  - コンサルタントが経営・マーケティング担当者へ説明するトーン（15.4章）
  - データから確認できない原因は断定せず、「可能性があります」等の推測表現を使う（15.5章）
  - 渡された数値以外の数値を一切生成しない
  - comparison_availableがfalseの項目については比較コメントを生成しない
- 生CSVは送信せず、集計済みJSONのみを送信する（15.2章）

## 7.4 生成タイミングとキャッシュ

- AI分析は対象月ごとに初回アクセス時に1回生成し、`ai_reports`へ保存する（27章前提）
- 同一対象月への再アクセスでは保存済みの結果を返す（再生成しない）
- 対象月データが再アップロードで置換された場合は4.2節の通り既存レポートを削除し、次回アクセス時に再生成する

## 7.5 AI API呼び出し失敗時の扱い

Claude API呼び出しがエラー・タイムアウトになった場合、`ai_reports`へは何も保存せず、ダッシュボードのAI分析欄に「AI分析を生成できませんでした。しばらくしてから再度お試しください」等のエラー表示を行う。売上・粗利・リピート率等のアプリケーション計算値の表示はAIの成否と独立しており、影響を受けない。

---

# 8. 認証・権限設計

- Supabase Authのメール＋パスワード認証を使用する
- セルフサインアップ画面は実装しない（27章）。アカウントはSupabaseダッシュボードまたは管理用スクリプト（Supabase Admin API）を用いて開発者が7名分を事前作成する
- 認証済みユーザーは全員同一のダッシュボード・データにアクセス可能とする（3.3章：役職別権限制御は行わない）
- Next.jsのmiddlewareで未認証アクセスをログイン画面へリダイレクトする
- ブラウザから直接呼び出すSupabase機能はAuth（ログイン・セッション確認）のみとする。`sales_transactions`等のデータ取得・更新は必ずNext.jsのAPIルートを経由し、そこでセッションを検証したうえでサーバー側から`@supabase/supabase-js`／RPCを呼び出す（20.3章）

---

# 9. API設計

| メソッド | パス | 説明 |
|---|---|---|
| POST | /api/uploads | CSVアップロード・検証（Next.js側）→ `replace_monthly_sales` RPC呼び出しでDB反映 |
| GET | /api/months | データが存在する対象月の一覧取得 |
| GET | /api/kpi?month=YYYY-MM | `get_monthly_summary` / `get_category_breakdown` / `get_sku_ranking` RPCの結果と前月比較をまとめて返す |
| GET | /api/kpi/trend?month=YYYY-MM&months=12 | `get_monthly_trend` RPCの結果（月次売上・粗利・リピート率推移）を返す |
| GET | /api/ai-report?month=YYYY-MM | AI分析結果の取得（無ければ生成） |

すべてのAPIはSupabase Authのセッションを検証した上でのみ処理する。RPC関数の呼び出しはNext.jsのAPIルート内（サーバー側）でのみ行い、ブラウザから直接RPCを呼び出すことはしない。

---

# 10. ディレクトリ構成（案）

```
app/
  (auth)/login/
  dashboard/
    page.tsx
  api/
    uploads/route.ts
    months/route.ts
    kpi/route.ts
    kpi/trend/route.ts
    ai-report/route.ts
lib/
  csv/           # パース・バリデーション
  kpi/           # RPC呼び出しのラッパー
  ai/            # Claude API呼び出し・プロンプト
  db/            # Supabaseクライアント
  auth/          # middleware・セッション検証
supabase/
  migrations/    # テーブル定義・RPC関数(replace_monthly_sales, get_monthly_summary 等)のSQLマイグレーション
components/
  charts/
  kpi-cards/
types/
tests/
```

---

# 11. CI/CD構成

## 11.1 Pull Request時（GitHub Actions）
`.github/workflows/pr-check.yml`にて以下を実行し、失敗時はmainへのマージをブロックする（ブランチ保護ルールと併用）。
- 型チェック（`tsc --noEmit`）
- Lint（ESLint）
- テスト（Vitest等。RPC呼び出し部分はSupabaseクライアントをモックし、実DBに接続しない単体テストを基本とする）
- ビルド確認（`next build`）

## 11.2 mainマージ後のデプロイ
GitHub ActionsでのデプロイジョブではなくVercelのGitHub連携（Git Integration）を使用する。mainブランチへのマージをVercelが検知し、自動的に本番環境へビルド・デプロイする。この方式は追加のデプロイ用ワークフローやシークレット管理（デプロイトークン等）を必要とせず、最も運用負荷が低い。

## 11.3 AIコードレビュー
導入候補のまま据え置く（23章）。コスト・必要性を確認した上で、将来Claude Code HeadlessをGitHub Actionsに追加する形で拡張可能。

---

# 12. セキュリティ設計

- `ANTHROPIC_API_KEY`、Supabaseのservice role keyはVercelの環境変数（Secrets）として設定し、ソースコードに記載しない（20.1章）
- Vercelの本番ドメインは標準でHTTPSが有効（20.2章）
- 全APIルートで認証セッションを検証し、未認証アクセスを拒否する（20.3章）
- `customer_id`以外の直接的個人情報（氏名・住所等）はDBスキーマ上そもそも保持しない（20.4章）
- データ削除は管理者がSupabaseダッシュボードから直接行う運用とし、削除用UIはPhase 1では実装しない（20.5章）

---

# 13. パフォーマンス設計

- 想定データ量（月間最大1万行、21章）に対し、`target_month`・`customer_id`・`order_date`へのインデックスを張ることで、集計・リピート率判定のクエリは十分高速に完了する見込み
- ダッシュボード表示はサーバーコンポーネントでSQL集計結果を取得してからレンダリングし、CSVアップロード後の検証・集計・表示を10秒以内で完了させる目標（21章）に対応する
- AI分析の生成（Claude API呼び出し）は上記の集計処理とは非同期・別リクエストとして扱い、パフォーマンス目標の計測対象に含めない（21章）

---

# 14. Phase 2以降を見据えた設計上の配慮

Phase 1のスコープを超えないが、将来の拡張（24章）を阻害しないよう以下を意識する。

- `sales_transactions`に将来`order_id`や担当営業列を追加してもスキーマ変更のみで対応できる
- 在庫回転率実装時は新規テーブル（在庫データ）を追加する形で対応でき、既存テーブルの改修は不要
- 日次・週次分析はorder_date単位で行データを保持しているため、集計クエリの粒度変更のみで対応可能

---

# 15. 実装時に確認する残課題

以下はアーキテクチャ設計時点で合理的なデフォルトを定めたが、実装着手前に軽く確認しておくことを推奨する。

- Vercel Proの実際のドル建て請求額とカード決済時の為替レートにより、月によっては5,000円をわずかに超える可能性がある。数ヶ月分の実績を見て許容範囲か判断する。
- Supabase Free tierの自動一時停止（7日間無アクセス）が実運用で問題になるか、初期運用で様子を見る。
