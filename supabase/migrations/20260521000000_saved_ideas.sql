CREATE TABLE IF NOT EXISTS public.saved_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  one_liner text,
  why_you text,
  why_now text,
  monetization_path text,
  tags text[] NOT NULL DEFAULT '{}',
  saved_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved ideas"
  ON public.saved_ideas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX saved_ideas_user_id_idx ON public.saved_ideas (user_id);

GRANT SELECT, INSERT, DELETE ON public.saved_ideas TO authenticated;
