-- BlockCred institution settings table for Supabase/PostgreSQL.
-- Keep secret payment gateway keys in backend environment variables only.
-- This table stores public institution identity, support contacts, and safe payment display configuration.

CREATE TABLE IF NOT EXISTS institution_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name text NOT NULL DEFAULT 'BlockCred Institution',
  institution_email text DEFAULT 'info@blockcred.local',
  institution_phone text DEFAULT 'Not configured',
  institution_address text DEFAULT 'Not configured',
  verification_system_name text DEFAULT 'BlockCred',
  certificate_access_fee numeric DEFAULT 5000,
  currency text DEFAULT 'XAF',
  payment_provider text DEFAULT 'mock',
  support_email text DEFAULT 'support@blockcred.local',
  support_phone text DEFAULT 'Not configured',
  updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO institution_settings (
  institution_name,
  institution_email,
  institution_phone,
  institution_address,
  verification_system_name,
  certificate_access_fee,
  currency,
  payment_provider,
  support_email,
  support_phone
)
SELECT
  'BlockCred Institution',
  'info@blockcred.local',
  'Not configured',
  'Not configured',
  'BlockCred',
  5000,
  'XAF',
  'mock',
  'support@blockcred.local',
  'Not configured'
WHERE NOT EXISTS (
  SELECT 1 FROM institution_settings
);
