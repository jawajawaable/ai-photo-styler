-- Get statistics for all users (Job counts)
DROP FUNCTION IF EXISTS admin_get_user_stats();
CREATE OR REPLACE FUNCTION admin_get_user_stats()
RETURNS TABLE (
  user_id UUID,
  job_count BIGINT,
  last_active TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.user_id,
    COUNT(*)::BIGINT as job_count,
    MAX(j.created_at)::TIMESTAMP as last_active
  FROM jobs j
  GROUP BY j.user_id
  ORDER BY job_count DESC;
END;
$$;

-- Get all file paths for a user to facilitate cleanup
CREATE OR REPLACE FUNCTION admin_get_user_file_paths(target_user_id UUID)
RETURNS TABLE (file_path TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT input_image_url FROM jobs WHERE user_id = target_user_id AND input_image_url IS NOT NULL
  UNION ALL
  SELECT input_image2_url FROM jobs WHERE user_id = target_user_id AND input_image2_url IS NOT NULL
  UNION ALL
  SELECT result_image_url FROM jobs WHERE user_id = target_user_id AND result_image_url IS NOT NULL;
END;
$$;
