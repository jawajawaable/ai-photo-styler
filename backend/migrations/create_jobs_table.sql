-- Create jobs table for async image generation
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    style_id TEXT NOT NULL,
    style_name TEXT NOT NULL,
    input_image_url TEXT NOT NULL,
    input_image2_url TEXT,
    result_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    prompt TEXT NOT NULL,
    estimated_completion TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- RLS Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
ON jobs FOR SELECT
USING (auth.uid() = user_id);

-- Users can create jobs
CREATE POLICY "Users can create jobs"
ON jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs (for status changes)
CREATE POLICY "Users can update own jobs"
ON jobs FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
ON jobs FOR DELETE
USING (auth.uid() = user_id);
