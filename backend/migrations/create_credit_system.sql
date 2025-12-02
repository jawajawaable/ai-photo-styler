-- Kredi ürünleri tablosu
CREATE TABLE IF NOT EXISTS credit_products (
  product_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kredi paketlerini ekle
INSERT INTO credit_products (product_id, name, credits, price_usd) VALUES
  ('satrayni_credits_10', 'Mini Paket', 10, 0.99),
  ('satrayni_credits_50', 'Standart Paket', 50, 3.99),
  ('satrayni_credits_100', 'Premium Paket', 100, 6.99),
  ('satrayni_credits_500', 'Ultimate Paket', 500, 24.99)
ON CONFLICT (product_id) DO NOTHING;

-- Satın alma geçmişi tablosu
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id TEXT REFERENCES credit_products(product_id),
  credits INTEGER NOT NULL,
  transaction_id TEXT UNIQUE,
  purchase_type TEXT DEFAULT 'manual', -- 'manual' veya 'iap'
  purchased_at TIMESTAMP DEFAULT NOW()
);

-- Manuel kredi ekleme stored procedure
CREATE OR REPLACE FUNCTION add_credits_manual(
  p_user_email TEXT,
  p_credits INTEGER
) RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_new_total INTEGER;
BEGIN
  -- Kullanıcıyı bul
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Kullanıcı bulunamadı');
  END IF;

  -- Kredi ekle
  UPDATE profiles
  SET credits = credits + p_credits
  WHERE id = v_user_id
  RETURNING credits INTO v_new_total;

  -- Geçmişe kaydet
  INSERT INTO purchases (user_id, credits, purchase_type)
  VALUES (v_user_id, p_credits, 'manual');

  RETURN json_build_object(
    'success', true, 
    'user_id', v_user_id,
    'credits_added', p_credits,
    'new_total', v_new_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
