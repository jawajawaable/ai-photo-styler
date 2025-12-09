-- Remote Procedure Call to manually add/remove credits for a specific user
-- Only accessible by service role or specific admin logic (RLS bypass)

CREATE OR REPLACE FUNCTION admin_add_credits(target_user_id UUID, amount INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
AS $$
DECLARE
    new_balance INT;
    user_exists BOOLEAN;
    current_balance INT;
BEGIN
    -- 1. Check if user exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = target_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    -- 2. Get current balance
    SELECT credits INTO current_balance FROM profiles WHERE id = target_user_id;
    IF current_balance IS NULL THEN
        current_balance := 0;
    END IF;

    -- 3. Calculate new balance (prevent negative if desired, but allow for adjustment)
    new_balance := current_balance + amount;
    IF new_balance < 0 THEN new_balance := 0; END IF;

    -- 4. Update
    UPDATE profiles
    SET credits = new_balance
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true, 
        'old_balance', current_balance,
        'new_balance', new_balance,
        'added_amount', amount
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
