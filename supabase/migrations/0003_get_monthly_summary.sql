-- Milestone 1: RPC関数 get_monthly_summary
-- ARCHITECTURE.md 6.1章に対応
-- 対象月の売上・粗利・リピート判定用の顧客数・販売数量をまとめて計算する。

create or replace function get_monthly_summary(p_target_month date)
returns table (
  revenue numeric,
  gross_profit numeric,
  unique_customers integer,
  repeat_customers integer,
  total_quantity numeric
) as $$
  select
    coalesce(sum(st.revenue), 0) as revenue,
    coalesce(sum(st.revenue - st.cost), 0) as gross_profit,
    -- 今月買った、顧客IDが分かる人の人数(重複なし)
    count(distinct st.customer_id) filter (where st.customer_id is not null) as unique_customers,
    -- そのうち、今月より前にも買ったことがある人の人数(=リピーター)
    count(distinct st.customer_id) filter (
      where st.customer_id is not null
        and exists (
          select 1 from sales_transactions prior
          where prior.customer_id = st.customer_id
            and prior.order_date < p_target_month
        )
    ) as repeat_customers,
    coalesce(sum(st.quantity), 0) as total_quantity
  from sales_transactions st
  where st.target_month = p_target_month;
$$ language sql stable;

-- サーバー側(service_role key)だけが呼び出せるようにする
revoke execute on function get_monthly_summary(date) from public;
grant execute on function get_monthly_summary(date) to service_role;
