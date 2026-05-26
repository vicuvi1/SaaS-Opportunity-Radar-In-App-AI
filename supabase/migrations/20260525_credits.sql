-- Credit balance per user (created on first deduction or explicit init)
CREATE TABLE IF NOT EXISTS user_credits (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits     INTEGER NOT NULL DEFAULT 20,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Users read their own balance; server-side calls use service role (bypasses RLS)
CREATE POLICY "users_read_own_credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Immutable audit log of every credit movement
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('purchase', 'deduction', 'init')),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ── Deduct credits atomically ──────────────────────────────────────────────
-- Returns true on success, false when balance is insufficient.
-- Initialises the row with 20 credits if it doesn't exist yet (new user).
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  -- Ensure row exists (new users start with 20)
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, 20)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT credits INTO v_credits
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE user_credits
  SET credits = credits - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'deduction', p_description);

  RETURN TRUE;
END;
$$;

-- ── Add credits (called by Stripe webhook after successful payment) ─────────
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits)
  VALUES (p_user_id, 20 + p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET credits    = user_credits.credits + p_amount,
        updated_at = NOW();

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'purchase', p_description);
END;
$$;

-- ── Bootstrap 20 credits for every new sign-up ────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits)
  VALUES (NEW.id, 20)
  ON CONFLICT DO NOTHING;

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 20, 'init', 'Welcome credits');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Grants ────────────────────────────────────────────────────────────────────
GRANT ALL ON public.user_credits TO service_role;
GRANT ALL ON public.credit_transactions TO service_role;
