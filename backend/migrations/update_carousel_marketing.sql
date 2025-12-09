-- 0. Ensure column exists (Fix for "column does not exist" error)
ALTER TABLE styles ADD COLUMN IF NOT EXISTS short_description TEXT;

-- 1. Düğün (Known ID from migrations: 'dugun')
UPDATE styles 
SET 
    short_description = 'Hayalinizdeki düğün fotoğrafı bir tık uzağınızda. Romantik ve profesyonel.',
    name = 'Rüya Düğün'
WHERE style_id = 'dugun';

-- 2. Vesikalık (Likely ID based on category logic)
UPDATE styles 
SET 
    short_description = 'Stüdyo kalitesinde resmi ve profesyonel vesikalıklar.',
    name = 'Pro Vesikalık'
WHERE style_id = 'vesikalik';

-- 3. Cyberpunk (Likely ID based on common styles, or generic update if name matches)
UPDATE styles 
SET 
    short_description = 'Neon ışıklarla dolu fütüristik bir dünyaya adım at.',
    name = 'Cyberpunk Estetiği' 
WHERE style_id = 'cyberpunk' OR name ILIKE '%cyber%';

-- 4. Anime (Likely ID)
UPDATE styles 
SET 
    short_description = 'Kendini epik bir anime karakterine dönüştür.',
    name = 'Anime Kahramanı'
WHERE style_id = 'anime' OR name ILIKE '%anime%';

-- 5. GENERIC UPDATE for ALL other Featured styles
-- This ensures "olan şeyler" (existing things) that we didn't name specifically still get cool text.
UPDATE styles
SET short_description = 'Yapay zeka ile fotoğraflarını sanat eserine dönüştür. Şimdi dene!'
WHERE featured_in_carousel = true 
  AND style_id NOT IN ('dugun', 'vesikalik', 'cyberpunk', 'anime')
  AND (short_description IS NULL OR length(short_description) < 15);
