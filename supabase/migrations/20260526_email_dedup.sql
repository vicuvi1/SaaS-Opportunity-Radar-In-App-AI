-- Track which emails have already received welcome credits.
-- Prevents re-granting credits if someone deletes and recreates their account.
CREATE TABLE IF NOT EXISTS used_signup_emails (
  email       TEXT PRIMARY KEY,
  first_user_id UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE used_signup_emails ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.used_signup_emails TO service_role;

-- Backfill existing users so they can't exploit the window before this migration
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, email FROM auth.users WHERE email IS NOT NULL LOOP
    INSERT INTO used_signup_emails (email, first_user_id)
    VALUES (LOWER(r.email), r.id)
    ON CONFLICT (email) DO NOTHING;
  END LOOP;
END;
$$;

-- Add email column to promo redemptions for cross-account deduplication
ALTER TABLE promo_code_redemptions
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Update trigger: only grant welcome credits to emails we haven't seen before
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  INSERT INTO used_signup_emails (email, first_user_id)
  VALUES (LOWER(NEW.email), NEW.id)
  ON CONFLICT (email) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    -- Fresh email: grant 20 welcome credits
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, 20)
    ON CONFLICT DO NOTHING;

    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 20, 'init', 'Welcome credits');
  ELSE
    -- Seen this email before: start at 0
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, 0)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
