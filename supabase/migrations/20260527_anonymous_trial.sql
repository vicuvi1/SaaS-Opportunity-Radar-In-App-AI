-- Anonymous trial sessions — fingerprint-based, no auth required.
-- Each visitor gets 3 credits (1 run of discover or validate) before signup.
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  fingerprint_id  TEXT PRIMARY KEY,
  credits         INTEGER NOT NULL DEFAULT 3,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service role only — no RLS needed since we bypass via service key.
GRANT ALL ON public.anonymous_sessions TO service_role;

-- Atomically deduct credits from an anonymous session.
-- Inserts a row with 3 credits on first use, then deducts.
-- Returns TRUE on success, FALSE if insufficient balance.
CREATE OR REPLACE FUNCTION deduct_anon_credits(
  p_fingerprint_id  TEXT,
  p_amount          INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  INSERT INTO anonymous_sessions (fingerprint_id, credits)
  VALUES (p_fingerprint_id, 3)
  ON CONFLICT (fingerprint_id) DO NOTHING;

  SELECT credits INTO v_credits
  FROM anonymous_sessions
  WHERE fingerprint_id = p_fingerprint_id
  FOR UPDATE;

  IF v_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE anonymous_sessions
  SET credits    = credits - p_amount,
      updated_at = NOW()
  WHERE fingerprint_id = p_fingerprint_id;

  RETURN TRUE;
END;
$$;

-- ── Change signup welcome credits from 20 → 10 ────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits)
  VALUES (NEW.id, 10)
  ON CONFLICT DO NOTHING;

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 10, 'init', 'Welcome credits');

  RETURN NEW;
END;
$$;

-- ── Update deduct_credits to initialise new users with 10 (not 20) ────────
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, 10)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT credits INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE user_credits
  SET credits    = credits - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'deduction', p_description);

  RETURN TRUE;
END;
$$;

-- ── Update add_credits to initialise new users with 10 (not 20) ───────────
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, 10 + p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET credits    = user_credits.credits + p_amount,
        updated_at = NOW();

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'purchase', p_description);
END;
$$;
