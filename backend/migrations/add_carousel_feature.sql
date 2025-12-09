-- Add featured_in_carousel column to styles table
-- This column controls which styles appear in the mobile app's carousel

ALTER TABLE styles 
ADD COLUMN IF NOT EXISTS featured_in_carousel BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN styles.featured_in_carousel IS 'Whether this style appears in the home screen carousel';
