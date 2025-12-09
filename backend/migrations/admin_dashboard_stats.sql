-- Get dashboard statistics
CREATE OR REPLACE FUNCTION admin_get_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_jobs BIGINT,
  jobs_last_24h BIGINT,
  failed_jobs BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles)::BIGINT as total_users,
    (SELECT COUNT(*) FROM jobs)::BIGINT as total_jobs,
    (SELECT COUNT(*) FROM jobs WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT as jobs_last_24h,
    (SELECT COUNT(*) FROM jobs WHERE status = 'failed')::BIGINT as failed_jobs;
END;
$$;
