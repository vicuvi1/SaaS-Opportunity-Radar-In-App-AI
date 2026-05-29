-- Restore profile row creation in handle_new_user.
-- Earlier migrations (credits, null_email_guard) replaced the function and
-- dropped the profiles insert that was in the original init migration.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  -- Always create a profile row so the user exists in public.profiles.
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- No email (anonymous auth or unusual OAuth) — grant credits, skip email tracking.
  IF NEW.email IS NULL THEN
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, 10)
    ON CONFLICT DO NOTHING;

    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 10, 'init', 'Welcome credits');

    RETURN NEW;
  END IF;

  INSERT INTO used_signup_emails (email, first_user_id)
  VALUES (LOWER(NEW.email), NEW.id)
  ON CONFLICT (email) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, 10)
    ON CONFLICT DO NOTHING;

    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 10, 'init', 'Welcome credits');
  ELSE
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, 0)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill profiles for accounts that signed up before this fix.
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
