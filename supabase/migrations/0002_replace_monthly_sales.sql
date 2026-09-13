-- Milestone 1: RPC関数 replace_monthly_sales
-- ARCHITECTURE.md 4.2章に対応
-- CSVアップロード時の「登録・置き換え」処理を、1回の呼び出しでまとめて行う。
-- 途中で失敗した場合は、PostgreSQLが自動的にすべてロールバック(元に戻す)する。

create or replace function replace_monthly_sales(
  p_target_month date,
  p_uploaded_by uuid,
  p_original_filename text,
  p_rows jsonb
) returns void as $$
begin
  -- 1. monthly_uploads を「登録中(pending)」として先に確保する
  --    (sales_transactionsがmonthly_uploadsを参照しているため、先に親を用意する必要がある)
  insert into monthly_uploads (target_month, uploaded_by, uploaded_at, original_filename, row_count, status)
  values (p_target_month, p_uploaded_by, now(), p_original_filename, 0, 'pending')
  on conflict (target_month) do update
    set uploaded_by = excluded.uploaded_by,
        uploaded_at = excluded.uploaded_at,
        original_filename = excluded.original_filename,
        status = 'pending';

  -- 2. その月の古いデータを削除する
  delete from sales_transactions where target_month = p_target_month;

  -- 3. 新しいデータ(CSVの中身)を登録する
  --    p_rows は [{"order_date": "...", "revenue": 1000, ...}, ...] という形式のJSONB
  insert into sales_transactions
    (target_month, order_date, customer_id, product_name, category, sku, quantity, revenue, cost)
  select
    p_target_month, x.order_date, x.customer_id, x.product_name, x.category, x.sku, x.quantity, x.revenue, x.cost
  from jsonb_to_recordset(p_rows) as x(
    order_date date, customer_id text, product_name text, category text,
    sku text, quantity numeric, revenue numeric, cost numeric
  );

  -- 4. monthly_uploads を「完了(completed)」に更新する
  update monthly_uploads
    set row_count = (select count(*) from sales_transactions where target_month = p_target_month),
        status = 'completed'
    where target_month = p_target_month;

  -- 5. その月のAI分析結果は古くなった可能性があるため削除する(次回アクセス時に作り直す)
  delete from ai_reports where target_month = p_target_month;
end;
$$ language plpgsql;

-- この関数は、サーバー側(service_role key)だけが呼び出せるようにする。
-- ブラウザ側(anon/authenticatedキー)から直接呼び出せてしまうと、
-- 誰でも売上データを書き換えられてしまうため。
revoke execute on function replace_monthly_sales(date, uuid, text, jsonb) from public;
grant execute on function replace_monthly_sales(date, uuid, text, jsonb) to service_role;
