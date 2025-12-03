-- Add image_url column to styles table
ALTER TABLE styles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing styles with some placeholder images (optional, but good for testing)
-- You can update these later from the Admin Panel
UPDATE styles SET image_url = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80' WHERE style_id = 'vesikalik';
UPDATE styles SET image_url = 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=800&q=80' WHERE style_id = 'bulut';
UPDATE styles SET image_url = 'https://images.unsplash.com/photo-1598197748967-b4674cb3c266?w=800&q=80' WHERE style_id = 'gryffindor';
UPDATE styles SET image_url = 'https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=800&q=80' WHERE style_id = 'anime';
