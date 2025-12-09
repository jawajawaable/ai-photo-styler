-- Function to fetch emails for specific user IDs (for Admin Panel)
create or replace function get_user_emails(user_ids uuid[])
returns table (id uuid, email varchar)
language plpgsql
security definer
as $$
begin
  return query
  select u.id, u.email::varchar
  from auth.users u
  where u.id = any(user_ids);
end;
$$;

-- Grant execute to authenticated users (so admin panel can call it)
grant execute on function get_user_emails(uuid[]) to authenticated;
