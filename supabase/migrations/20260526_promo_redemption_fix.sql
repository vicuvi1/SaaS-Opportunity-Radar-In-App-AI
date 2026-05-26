-- Promo redemption records must survive account deletion so the same email
-- can't re-use a code by deleting and recreating their account.

-- Make user_id nullable so the row persists when the user is deleted
ALTER TABLE promo_code_redemptions ALTER COLUMN user_id DROP NOT NULL;

-- Change ON DELETE CASCADE → SET NULL so the row stays after account deletion
ALTER TABLE promo_code_redemptions
  DROP CONSTRAINT IF EXISTS promo_code_redemptions_user_id_fkey;

ALTER TABLE promo_code_redemptions
  ADD CONSTRAINT promo_code_redemptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop the old (code, user_id) unique constraint — user_id is nullable now
ALTER TABLE promo_code_redemptions
  DROP CONSTRAINT IF EXISTS promo_code_redemptions_code_user_id_key;

-- Enforce uniqueness on (code, email) instead — this is the permanent dedup key
ALTER TABLE promo_code_redemptions
  ADD CONSTRAINT promo_code_redemptions_code_email_key
  UNIQUE (code, email);
