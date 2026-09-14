-- Milestone 1: RPC関数 get_monthly_trend
-- ARCHITECTURE.md 6.5章に対応
-- p_target_monthを含む過去p_months分の、売上・粗利・リピート率の推移をまとめて返す。
-- データが存在する月(monthly_uploadsに登録済みの月)のみを対象とする。

create or replace function get_monthly_trend(p_target_month date, p_months int default 12)
returns table (
  target_month date,
  revenue numeric,
  gross_profit numeric,
  unique_customers integer,
  repeat_customers integer,
  repeat_rate numeric
) as $$
  select
    mu.target_month,
    coalesce(sum(st.revenue), 0) as revenue,
    coalesce(sum(st.revenue - st.cost), 0) as gross_profit,
    count(distinct st.customer_id) filter (where st.customer_id is not null) as unique_customers,
    count(distinct st.customer_id) filter (
      where st.customer_id is not null
        and exists (
          select 1 from sales_transactions prior
          where prior.customer_id = st.customer_id
            and prior.order_date < mu.target_month
        )
    ) as repeat_customers,
    case
      -- その月より前のデータが1件も無ければ「算出不可」を意味するNULL
      when not exists (select 1 from sales_transactions e where e.order_date < mu.target_month) then null
      when count(distinct st.customer_id) filter (where st.customer_id is not null) = 0 then null
      else round(
        count(distinct st.customer_id) filter (
          where st.customer_id is not null
            and exists (
              select 1 from sales_transactions prior
              where prior.customer_id = st.customer_id
                and prior.order_date < mu.target_month
            )
        )::numeric
        / nullif(count(distinct st.customer_id) filter (where st.customer_id is not null), 0) * 100
      , 1)
    end as repeat_rate
  from monthly_uploads mu
  left join sales_transactions st on st.target_month = mu.target_month
  where mu.target_month between (p_target_month - (p_months - 1) * interval '1 month')::date and p_target_month
  group by mu.target_month
  order by mu.target_month;
$$ language sql stable;

revoke execute on function get_monthly_trend(date, int) from public;
grant execute on function get_monthly_trend(date, int) to service_role;
