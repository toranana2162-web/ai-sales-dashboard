-- Milestone 1: RPC関数 get_category_breakdown
-- ARCHITECTURE.md 6.3章に対応
-- 対象月のカテゴリ別売上を、売上が多い順に返す。

create or replace function get_category_breakdown(p_target_month date)
returns table (category text, revenue numeric) as $$
  select category, sum(revenue) as revenue
  from sales_transactions
  where target_month = p_target_month
  group by category
  order by sum(revenue) desc;
$$ language sql stable;

revoke execute on function get_category_breakdown(date) from public;
grant execute on function get_category_breakdown(date) to service_role;
