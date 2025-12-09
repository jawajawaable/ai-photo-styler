-- Function to fetch ALL jobs for the admin panel analytics
-- Bypasses RLS using SECURITY DEFINER
create or replace function get_admin_analytics_data(limit_count int default 1000)
returns table (
  id uuid,
  style_id text,
  user_id uuid,
  created_at timestamp,
  status text,
  style_name text
)
language plpgsql
security definer
as $$
begin
  return query
  select j.id, j.style_id, j.user_id, j.created_at, j.status, j.style_name
  from public.jobs j
  order by j.created_at desc
  limit limit_count;
end;
$$;

-- Grant execute permission to authenticated users
-- (Application logic in admin.html protects this via email whitelist)
grant execute on function get_admin_analytics_data(int) to authenticated;
