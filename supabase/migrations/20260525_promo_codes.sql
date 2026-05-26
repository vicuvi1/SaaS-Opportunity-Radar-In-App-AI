-- Promo codes redeemable for free credits
CREATE TABLE IF NOT EXISTS promo_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  credits     INTEGER NOT NULL,
  max_uses    INTEGER,          -- NULL = unlimited
  uses_count  INTEGER NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,      -- NULL = never expires
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
-- No user-facing policy; all access via service role key

-- One redemption record per (code, user) — prevents double-dipping
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_granted INTEGER NOT NULL,
  redeemed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code, user_id)
);

ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_redemptions"
  ON promo_code_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- ── Grants ───────────────────────────────────────────────────────────────────
GRANT ALL ON public.promo_codes TO service_role;
GRANT ALL ON public.promo_code_redemptions TO service_role;

-- ── Seed promo codes ──────────────────────────────────────────────────────────
INSERT INTO promo_codes (code, credits, max_uses, active)
VALUES
  ('VINNYG123',    1000, NULL, true),  -- family & friends, unlimited uses
  ('50FOUNDER50',    50, NULL, true)   -- early founder promo
ON CONFLICT (code) DO NOTHING;
