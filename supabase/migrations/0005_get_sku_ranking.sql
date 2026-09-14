-- Milestone 1: RPC関数 get_sku_ranking
-- ARCHITECTURE.md 6.4章に対応
-- 対象月のSKU別売上を、売上が多い順にTOP N件返す(デフォルト10件)。

create or replace function get_sku_ranking(p_target_month date, p_limit int default 10)
returns table (sku text, product_name text, revenue numeric) as $$
  select sku, max(product_name) as product_name, sum(revenue) as revenue
  from sales_transactions
  where target_month = p_target_month
  group by sku
  order by sum(revenue) desc
  limit p_limit;
$$ language sql stable;

revoke execute on function get_sku_ranking(date, int) from public;
grant execute on function get_sku_ranking(date, int) to service_role;
