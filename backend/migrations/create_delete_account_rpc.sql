-- Create a function for users to delete their own account
create or replace function delete_own_account()
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
begin
  -- Get the current user's ID
  current_user_id := auth.uid();

  -- Verify user is logged in
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Delete user's jobs (images)
  -- This might be redundant if ON DELETE CASCADE is set on foreign keys, 
  -- but safer to be explicit or ensure data cleanup.
  delete from public.jobs where user_id = current_user_id;

  -- 2. Delete user's profile
  delete from public.profiles where id = current_user_id;

  -- 3. Delete from auth.users (This is the critical part)
  -- Because this function is 'security definer', it runs with admin privileges,
  -- allowing it to delete from auth.users
  delete from auth.users where id = current_user_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function delete_own_account() to authenticated;
