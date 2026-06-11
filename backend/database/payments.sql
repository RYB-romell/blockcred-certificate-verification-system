-- BlockCred payments table for Supabase/PostgreSQL.
--
-- Security notes:
-- - Do not expose the Supabase service role key to the frontend.
-- - Payment status updates should happen from backend webhook/controller logic only.
-- - Student certificate access is currently controlled by students.subscription_status.
-- - Do not add unsafe public RLS policies for payment writes.
--
-- Optional RLS note:
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- Add policies only after the backend payment flow and frontend access rules are finalized.

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text,
  student_email text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'XAF',
  gateway text NOT NULL DEFAULT 'mock',
  payment_reference text NOT NULL UNIQUE,
  gateway_transaction_id text,
  status text NOT NULL DEFAULT 'pending',
  checkout_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  CONSTRAINT payments_status_check CHECK (
    status IN ('pending', 'successful', 'failed', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS payments_student_id_idx
  ON payments (student_id);

CREATE INDEX IF NOT EXISTS payments_student_email_idx
  ON payments (student_email);

CREATE INDEX IF NOT EXISTS payments_payment_reference_idx
  ON payments (payment_reference);

CREATE INDEX IF NOT EXISTS payments_status_idx
  ON payments (status);

CREATE INDEX IF NOT EXISTS payments_created_at_idx
  ON payments (created_at);
