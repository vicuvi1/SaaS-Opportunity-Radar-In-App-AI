-- Guard handle_new_user against NULL emails.
-- Anonymous auth users or unusual OAuth providers may have no email.
-- Without this guard, inserting NULL into the used_signup_emails PRIMARY KEY
-- would throw a not-null constraint error and roll back the entire signup.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  -- No email (anonymous auth or unusual OAuth) — grant credits, skip email tracking
  IF NEW.email IS NULL THEN
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, 20)
    ON CONFLICT DO NOTHING;

    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 20, 'init', 'Welcome credits');

    RETURN NEW;
  END IF;

  INSERT INTO used_signup_emails (email, first_user_id)
  VALUES (LOWER(NEW.email), NEW.id)
  ON CONFLICT (email) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, 20)
    ON CONFLICT DO NOTHING;

    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (NEW.id, 20, 'init', 'Welcome credits');
  ELSE
    INSERT INTO user_credits (user_id, credits)
    VALUES (NEW.id, 0)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
