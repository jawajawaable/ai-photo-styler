-- Enable Row Level Security for all tables
-- This ensures only authorized users can access/modify data

-- =====================================================
-- STYLES TABLE - Admin Only Write, Public Read
-- =====================================================

-- Enable RLS
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can READ styles (for mobile app)
CREATE POLICY "Public can view styles"
ON styles
FOR SELECT
USING (is_active = true);

-- Policy 2: Only authenticated users can INSERT styles (admin panel)
CREATE POLICY "Authenticated users can create styles"
ON styles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Only authenticated users can UPDATE styles (admin panel)
CREATE POLICY "Authenticated users can update styles"
ON styles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Only authenticated users can DELETE styles (admin panel)
CREATE POLICY "Authenticated users can delete styles"
ON styles
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- JOBS TABLE - User-Specific Access
-- =====================================================

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only view their own jobs
CREATE POLICY "Users can view own jobs"
ON jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can create their own jobs
CREATE POLICY "Users can create own jobs"
ON jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own jobs
CREATE POLICY "Users can update own jobs"
ON jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
ON jobs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE - Style Images (Admin) and Job Images (Users)
-- =====================================================

-- Style images bucket: Admin only upload
CREATE POLICY "Authenticated users can upload style images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'style-images');

CREATE POLICY "Anyone can view style images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'style-images');

-- Job images bucket: Users can upload their own
CREATE POLICY "Users can upload job images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'job-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their job images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'job-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- VERIFICATION & NOTES
-- =====================================================

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View all policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- IMPORTANT NOTES:
-- 1. Admin panel users MUST be authenticated (email/password login)
-- 2. Mobile app users MUST be authenticated to create jobs
-- 3. Anon key can only READ styles (public access)
-- 4. Service role key bypasses RLS (use for backend only)
