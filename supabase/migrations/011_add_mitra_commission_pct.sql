-- Ensure the partner commission rate exists in databases created from older schemas.
ALTER TABLE public.mitra
  ADD COLUMN IF NOT EXISTS commission_pct numeric NOT NULL DEFAULT 10;
