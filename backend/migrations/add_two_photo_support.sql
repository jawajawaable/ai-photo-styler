-- Add support for styles that require two photos
ALTER TABLE styles ADD COLUMN IF NOT EXISTS requires_two_photos BOOLEAN DEFAULT false;

-- Insert wedding style that requires two photos
INSERT INTO styles (
  style_id, 
  name, 
  description, 
  prompt_modifier, 
  icon, 
  color, 
  requires_two_photos, 
  is_active,
  sort_order
) VALUES (
  'dugun',
  'Düğün',
  'İki kişilik düğün fotoğrafı - Erkek ve kadın fotoğrafı birleştirilerek romantik düğün pozu oluşturulur.',
  'A digitally rendered image features a couple, a man and a woman, dressed in formal wedding attire, positioned against a vibrant blue, textured background that resembles a cloudy sky. The man is on the left, facing forward with a serious, intense expression. The couple is positioned closely together, and they are shown shaking hands with a firm grip in the center foreground of the image. The lighting is dramatic, highlighting the features of the subjects against the brightly colored background.',
  '💑',
  '#ec4899',
  true,
  true,
  10
)
ON CONFLICT (style_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  prompt_modifier = EXCLUDED.prompt_modifier,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  requires_two_photos = EXCLUDED.requires_two_photos,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;
