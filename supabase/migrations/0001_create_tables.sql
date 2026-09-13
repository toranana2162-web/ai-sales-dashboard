-- Milestone 1: テーブル定義
-- ARCHITECTURE.md 4.1章のテーブル一覧に対応

-- 1. profiles: 利用者プロフィール
-- Supabase Authでログインしたユーザー(auth.users)と1:1で対応する
create table if not exists profiles (
  id uuid primary key references auth.users (id),
  display_name text,
  created_at timestamptz not null default now()
);

-- 2. monthly_uploads: 月次アップロード管理
-- 「どの月のデータが、いつ、誰によって登録されたか」を管理する
create table if not exists monthly_uploads (
  target_month date primary key,
  uploaded_by uuid references profiles (id),
  uploaded_at timestamptz not null default now(),
  original_filename text,
  row_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'completed'))
);

-- 3. sales_transactions: 取引明細(CSVからアップロードされた売上データ本体)
create table if not exists sales_transactions (
  id bigserial primary key,
  target_month date not null references monthly_uploads (target_month),
  order_date date not null,
  customer_id text,
  product_name text,
  category text,
  sku text,
  quantity numeric,
  revenue numeric not null,
  cost numeric not null,
  created_at timestamptz not null default now()
);

-- 検索を高速にするためのインデックス
create index if not exists idx_sales_transactions_target_month on sales_transactions (target_month);
create index if not exists idx_sales_transactions_customer_id on sales_transactions (customer_id);
create index if not exists idx_sales_transactions_order_date on sales_transactions (order_date);

-- 4. ai_reports: AI分析結果
-- 対象月ごとに1件だけ保存する(target_monthが主キー)
create table if not exists ai_reports (
  target_month date primary key references monthly_uploads (target_month),
  generated_at timestamptz not null default now(),
  model_used text,
  input_payload jsonb,
  summary text,
  key_changes text,
  top_contributors text,
  notable_points text,
  next_actions text
);
